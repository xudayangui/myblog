/**
 * 技术雷达 · 数据源抓取脚本
 *
 * 从技术站点的公开 RSS + GitHub 代码仓库抓取元数据（标题 / 链接 / 摘要 / 来源 / 时间 / 分类），
 * 聚合到 .vitepress/theme/feeds.data.json，供「技术雷达」页面展示。
 *
 * 设计原则：
 * - 只抓元数据，不存正文。点击跳转原文，尊重版权与原作者。
 * - 任一源失败不影响其他源；全部失败时保留上一次的缓存数据。
 * - 按 URL 去重；前端主题关键词加权排序。
 * - 无任何第三方依赖，仅用 Node 内置 fetch。
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, '.vitepress/theme/feeds.data.json')

// RSS 源：每个源的抓取条数上限 + 默认分类（用于前端 / 后端 / AI / 资讯分栏）
const FEEDS = [
  { key: 'juejin', name: '掘金', url: 'https://juejin.cn/rss', limit: 30, category: 'frontend' },
  { key: 'oschina', name: 'OSCHINA', url: 'https://www.oschina.net/news/rss', limit: 60, category: 'news' },
  { key: 'cnbeta', name: 'cnBeta', url: 'https://rss.cnbeta.com.tw/rss', limit: 80, category: 'news' },
  { key: 'react', name: 'React', url: 'https://react.dev/rss.xml', limit: 30, category: 'frontend' },
  { key: 'vue', name: 'Vue', url: 'https://blog.vuejs.org/feed.rss', limit: 20, category: 'frontend' },
  { key: 'nodejs', name: 'Node.js', url: 'https://nodejs.org/en/feed/releases.xml', limit: 30, category: 'backend' },
  { key: 'css', name: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', limit: 20, category: 'frontend' },
  { key: 'smashing', name: 'Smashing', url: 'https://www.smashingmagazine.com/feed/', limit: 30, category: 'frontend' },
  { key: 'echojs', name: 'EchoJS', url: 'https://www.echojs.com/rss', limit: 40, category: 'frontend' },
  { key: 'devto', name: 'DEV', url: 'https://dev.to/feed', limit: 20, category: 'frontend' },
  { key: 'ruanyifeng', name: '阮一峰', url: 'https://www.ruanyifeng.com/blog/atom.xml', limit: 12, category: 'news' },
  { key: 'hn', name: 'HackerNews', url: 'https://hnrss.org/frontpage', limit: 30, category: 'news' },
  { key: 'solidot', name: 'Solidot', url: 'https://www.solidot.org/index.rss', limit: 30, category: 'news' }
]

// GitHub 仓库查询：多组 topic / 时间窗口，覆盖前端技术栈与最新热门项目
const REPO_QUERIES = [
  { key: 'gh-trend', label: 'GitHub Trending', q: 'created:>2026-10-01', sort: 'stars', limit: 30 },
  { key: 'gh-js', label: 'GitHub · JavaScript', q: 'topic:javascript pushed:>2026-09-01', sort: 'stars', limit: 25 },
  { key: 'gh-vue', label: 'GitHub · Vue', q: 'topic:vue pushed:>2026-09-01', sort: 'stars', limit: 20 },
  { key: 'gh-react', label: 'GitHub · React', q: 'topic:react pushed:>2026-09-01', sort: 'stars', limit: 20 },
  { key: 'gh-node', label: 'GitHub · Node.js', q: 'topic:nodejs pushed:>2026-09-01', sort: 'stars', limit: 20 },
  { key: 'gh-ai', label: 'GitHub · AI', q: 'topic:ai pushed:>2026-09-01', sort: 'stars', limit: 20 }
]

const UA = 'Mozilla/5.0 (compatible; TechRadarBot/1.0; +https://github.com/xudayangui/myblog)'

// 前端主题关键词：命中则排序加权
const FRONTEND_KEYWORDS = [
  'vue', 'react', 'node', 'javascript', 'typescript', 'js', 'css', 'html',
  'webpack', 'vite', 'npm', 'frontend', '前端', '浏览器', 'python',
  'ai', '开源', '框架', '性能', '算法', '面试', 'docker', 'kubernetes'
]
// AI 关键词：命中则归入 AI 分类（优先于来源默认分类）
const AI_KEYWORDS = ['ai', '人工智能', '大模型', 'llm', 'gpt', 'claude', 'agent', '机器学习', '深度学习', 'aigc', 'diffusion']

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '…')
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function stripHtml(s) {
  return decodeEntities(String(s).replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').replace(/<[^>]*>/g, ' '))
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

function weight(item) {
  const text = (item.title + ' ' + (item.summary || '')).toLowerCase()
  return FRONTEND_KEYWORDS.reduce((acc, k) => acc + (text.includes(k) ? 1 : 0), 0)
}

// 根据内容智能归类：AI 优先命中，否则用来源默认分类
function categorize(item, defaultCat) {
  const text = (item.title + ' ' + (item.summary || '')).toLowerCase()
  if (AI_KEYWORDS.some((k) => text.includes(k))) return 'ai'
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
    const title = tag(b, 'title')
    const url = link(b)
    if (!title || !/^https?:\/\//.test(url)) continue
    const summary = truncate(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content'))
    const item = {
      title: truncate(title, 90), url, summary,
      source: feed.name, sourceKey: feed.key,
      date: toDate(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated')),
      category: 'news', type: 'article'
    }
    item.category = categorize(item, feed.category)
    item._w = weight(item)
    items.push(item)
  }
  return items
}

// GitHub 仓库：调用官方 Search API，按 star 排序取近期活跃项目
async function fetchRepos(query) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query.q)}&sort=${query.sort}&order=desc&per_page=${query.limit}`
  const text = await get(url, 15000, {
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28'
  })
  const data = JSON.parse(text)
  if (!Array.isArray(data.items)) throw new Error(data.message || 'API 未返回 items')
  return data.items.map((r) => {
    const item = {
      title: r.full_name,
      url: r.html_url,
      summary: truncate(r.description || `A ${r.language || 'open-source'} project on GitHub with ${r.stargazers_count.toLocaleString()} stars.`),
      source: query.label,
      sourceKey: 'github',
      date: toDate(r.pushed_at || r.created_at),
      category: 'repo',
      type: 'repo',
      stars: r.stargazers_count,
      language: r.language || '',
      license: r.license?.spdx_id && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id : ''
    }
    item._w = weight(item)
    return item
  })
}

async function readCache() {
  try { return JSON.parse(await readFile(OUT, 'utf8')) } catch { return null }
}

async function main() {
  console.log('技术雷达 · 正在抓取数据源…')
  const all = []
  const failed = []
  const seen = new Set()

  const addItems = (items) => {
    let added = 0
    for (const item of items) {
      if (seen.has(item.url)) continue
      seen.add(item.url)
      delete item._w
      all.push(item)
      added++
    }
    return added
  }

  // RSS 源
  for (const feed of FEEDS) {
    try {
      const items = parseRss(await get(feed.url), feed)
      if (!items.length) throw new Error('未解析到条目')
      console.log(`  ✓ ${feed.name}: ${addItems(items)} 篇`)
    } catch (e) {
      failed.push(feed.name)
      console.warn(`  ! ${feed.name} 抓取失败: ${e.message}`)
    }
  }

  // GitHub 仓库源
  for (const query of REPO_QUERIES) {
    try {
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
    if (cache?.items?.length) {
      console.warn('所有数据源均失败，保留上次缓存数据。')
      return
    }
    throw new Error('所有数据源均失败且无缓存')
  }

  // 按日期倒序
  all.sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : 0))

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), items: all }, null, 2), 'utf8')
  const repos = all.filter((i) => i.type === 'repo').length
  console.log(`完成：共 ${all.length} 条（文章 ${all.length - repos} · 仓库 ${repos}）→ ${OUT}`)
  if (failed.length) console.warn(`失败源（已跳过）: ${failed.join('、')}`)
}

main().catch((e) => { console.error(e); process.exitCode = 1 })
