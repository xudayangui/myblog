/**
 * 技术雷达 · 数据源抓取脚本（全中文源）
 *
 * 只聚合中文技术站点 RSS + GitHub 仓库元数据到 .vitepress/theme/feeds.data.json。
 * - 文章源全部为中文社区 / 媒体，并做中文标题检测兜底（非中文标题直接丢弃）。
 * - 代码仓库源使用 GitHub Search API（项目名天然为英文，归入「代码仓库」分类）。
 * - 只抓元数据，不存正文；点击跳转原文，尊重版权。
 * - 任一源失败不影响其他源；全部失败时保留上一次缓存。
 * - 无任何第三方依赖，仅用 Node 内置 fetch。
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, '.vitepress/theme/feeds.data.json')

// 全中文 RSS 源：标题实测 100% 含中文
const FEEDS = [
  { key: 'juejin', name: '掘金', url: 'https://juejin.cn/rss', limit: 30, category: 'frontend' },
  { key: 'oschina', name: 'OSCHINA', url: 'https://www.oschina.net/news/rss', limit: 60, category: 'news' },
  { key: 'cnbeta', name: 'cnBeta', url: 'https://rss.cnbeta.com.tw/rss', limit: 100, category: 'news' },
  { key: 'ruanyifeng', name: '阮一峰', url: 'https://www.ruanyifeng.com/blog/atom.xml', limit: 12, category: 'frontend' },
  { key: 'solidot', name: 'Solidot', url: 'https://www.solidot.org/index.rss', limit: 40, category: 'news' },
  { key: 'v2ex', name: 'V2EX', url: 'https://www.v2ex.com/feed/tab/tech.xml', limit: 40, category: 'news' },
  { key: 'qbitai', name: '量子位', url: 'https://www.qbitai.com/feed', limit: 20, category: 'ai' },
  { key: 'ifanr', name: '爱范儿', url: 'https://www.ifanr.com/feed', limit: 25, category: 'ai' },
  { key: 'ithome', name: 'IT之家', url: 'https://www.ithome.com/rss/', limit: 60, category: 'news' }
]

// 动态计算日期窗口（避免硬编码日期随时间失效）
function daysAgo(n) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}
const createdSince = daysAgo(60)
const pushedSince = daysAgo(90)

// GitHub 仓库查询：覆盖前端技术栈、后端与 AI
const REPO_QUERIES = [
  { key: 'gh-trend', label: 'GitHub 热门', q: `created:>${createdSince}`, sort: 'stars', limit: 30 },
  { key: 'gh-js', label: 'GitHub · JavaScript', q: `topic:javascript pushed:>${pushedSince}`, sort: 'stars', limit: 25 },
  { key: 'gh-vue', label: 'GitHub · Vue', q: `topic:vue pushed:>${pushedSince}`, sort: 'stars', limit: 20 },
  { key: 'gh-react', label: 'GitHub · React', q: `topic:react pushed:>${pushedSince}`, sort: 'stars', limit: 20 },
  { key: 'gh-node', label: 'GitHub · Node.js', q: `topic:nodejs pushed:>${pushedSince}`, sort: 'stars', limit: 20 },
  { key: 'gh-ai', label: 'GitHub · AI', q: `topic:ai pushed:>${pushedSince}`, sort: 'stars', limit: 20 }
]

const UA = 'Mozilla/5.0 (compatible; TechRadarBot/1.0; +https://github.com/xudayangui/myblog)'

// AI 关键词：命中则归入 AI 分类（优先于来源默认分类）
const AI_KEYWORDS = ['ai', '人工智能', '大模型', 'llm', 'gpt', 'claude', 'agent', '机器学习', '深度学习', 'aigc', 'diffusion', 'gemini', '智能体', '神经网络', '算力']
// 后端关键词：命中则归入后端分类
const BACKEND_KEYWORDS = ['数据库', 'mysql', 'redis', '服务器', '后端', '云原生', 'kubernetes', 'docker', '微服务', 'nginx', 'linux', '操作系统', '编译器', '编程语言', 'java', 'golang', 'rust', '数据库', '存储', '分布式', '并发', '缓存', 'api', 'http']
// 前端关键词：命中则归入前端分类
const FRONTEND_KEYWORDS = ['前端', 'javascript', 'vue', 'react', 'css', 'html', '浏览器', 'chrome', 'node', 'typescript', 'webpack', 'vite', '框架', '组件', '网页', 'web', '动画', 'ui', '界面']

const hasChinese = (s) => /[\u4e00-\u9fa5]/.test(String(s))

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '…')
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function stripHtml(s) {
  let out = String(s).replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '')
  // 先解码实体再去标签，循环两轮应对 &lt;p&gt; 这类转义标签（IT之家源）
  for (let i = 0; i < 2; i++) {
    out = decodeEntities(out).replace(/<[^>]*>/g, ' ')
  }
  return out
    .replace(/Article URL:\s*https?:\/\/\S+/gi, '')
    .replace(/Comments?\s*$/i, '')
    .replace(/\s+/g, ' ').trim()
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))
  if (!m) return ''
  return stripHtml(m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, ''))
}

function link(block) {
  const selfClosing = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i)
  if (selfClosing) return decodeEntities(selfClosing[1]).trim()
  const wrapped = block.match(/<link(?:\s[^>]*)?>([\s\S]*?)<\/link>/i)
  if (wrapped) return stripHtml(wrapped[1])
  return ''
}

function toDate(s) {
  if (!s) return ''
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

function truncate(s, n = 120) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s
}

function categorize(item, defaultCat) {
  const text = (item.title + ' ' + (item.summary || '')).toLowerCase()
  if (AI_KEYWORDS.some((k) => text.includes(k))) return 'ai'
  if (FRONTEND_KEYWORDS.some((k) => text.includes(k))) return 'frontend'
  if (BACKEND_KEYWORDS.some((k) => text.includes(k))) return 'backend'
  return defaultCat || 'news'
}

async function get(url, timeout = 12000, headers = {}) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeout)
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      headers: { 'user-agent': UA, accept: 'application/rss+xml,application/xml,text/xml,*/*', ...headers }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

function parseRss(xml, feed) {
  const items = []
  const re = /<(item|entry)(?:\s[\s\S]*?)?>[\s\S]*?<\/\1>/gi
  let m
  while ((m = re.exec(xml)) && items.length < feed.limit) {
    const b = m[0]
    let title = tag(b, 'title')
    const url = link(b)
    if (!title || !/^https?:\/\//.test(url)) continue
    // 中文兜底：标题必须含中文；去掉常见的前缀噪音
    if (!hasChinese(title)) continue
    title = title.replace(/^(科技爱好者周刊|派早报)[：:]/, (x) => x).trim()
    const summary = truncate(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content'))
    const item = {
      title: truncate(title, 90), url, summary,
      source: feed.name, sourceKey: feed.key,
      date: toDate(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated')),
      category: 'news', type: 'article'
    }
    item.category = categorize(item, feed.category)
    items.push(item)
  }
  return items
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

async function fetchRepos(query) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query.q)}&sort=${query.sort}&order=desc&per_page=${query.limit}`
  const headers = { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' }
  let text = ''
  // 限流（403/429）时退避重试，最多 3 次
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      text = await get(url, 15000, headers)
      break
    } catch (e) {
      if (/403|429/.test(e.message) && attempt < 2) {
        await sleep(4000 * (attempt + 1))
        continue
      }
      throw e
    }
  }
  const data = JSON.parse(text)
  if (!Array.isArray(data.items)) throw new Error(data.message || 'API 未返回 items')
  return data.items.map((r) => ({
    title: r.full_name,
    url: r.html_url,
    summary: truncate(r.description || `A ${r.language || 'open-source'} project on GitHub with ${r.stargazers_count.toLocaleString()} stars.`),
    source: query.label, sourceKey: 'github',
    date: toDate(r.pushed_at || r.created_at),
    category: 'repo', type: 'repo',
    stars: r.stargazers_count, language: r.language || '',
    license: r.license?.spdx_id && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id : ''
  }))
}

async function readCache() {
  try { return JSON.parse(await readFile(OUT, 'utf8')) } catch { return null }
}

async function main() {
  console.log('技术雷达 · 正在抓取中文数据源…')
  const all = []
  const failed = []
  const seen = new Set()

  const addItems = (items) => {
    let added = 0
    for (const item of items) {
      if (seen.has(item.url)) continue
      seen.add(item.url)
      all.push(item)
      added++
    }
    return added
  }

  for (const feed of FEEDS) {
    try {
      const items = parseRss(await get(feed.url), feed)
      if (!items.length) throw new Error('未解析到中文条目')
      console.log(`  ✓ ${feed.name}: ${addItems(items)} 篇`)
    } catch (e) {
      failed.push(feed.name)
      console.warn(`  ! ${feed.name} 抓取失败: ${e.message}`)
    }
  }

  for (const query of REPO_QUERIES) {
    try {
      await sleep(3000) // GitHub Search API 未认证限流约 10 次/分钟，节流避免 403
      const items = await fetchRepos(query)
      if (!items.length) throw new Error('未解析到仓库')
      console.log(`  ✓ ${query.label}: ${addItems(items)} 个仓库`)
    } catch (e) {
      failed.push(query.label)
      console.warn(`  ! ${query.label} 抓取失败: ${e.message}`)
    }
  }

  if (!all.length) {
    const cache = await readCache()
    if (cache?.items?.length) { console.warn('所有数据源均失败，保留上次缓存数据。'); return }
    throw new Error('所有数据源均失败且无缓存')
  }

  all.sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : 0))

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), items: all }, null, 2), 'utf8')
  const repos = all.filter((i) => i.type === 'repo').length
  const nonChinese = all.filter((i) => i.type === 'article' && !hasChinese(i.title)).length
  console.log(`完成：共 ${all.length} 条（文章 ${all.length - repos} · 仓库 ${repos}）`)
  console.log(`文章中文检测：非中文标题 ${nonChinese} 条`)
  if (failed.length) console.warn(`失败源（已跳过）: ${failed.join('、')}`)
}

main().catch((e) => { console.error(e); process.exitCode = 1 })
