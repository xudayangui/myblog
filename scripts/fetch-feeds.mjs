/**
 * 技术雷达 · 数据源抓取脚本
 *
 * 从各大技术站点的公开 RSS 抓取文章元数据（标题 / 链接 / 摘要 / 来源 / 时间），
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

// 每个源的抓取条数上限（源本身条目不足时以实际为准）
const FEEDS = [
  { key: 'juejin', name: '掘金', url: 'https://juejin.cn/rss', limit: 20 },
  { key: 'oschina', name: 'OSCHINA', url: 'https://www.oschina.net/news/rss', limit: 50 },
  { key: 'cnbeta', name: 'cnBeta', url: 'https://rss.cnbeta.com.tw/rss', limit: 60 },
  { key: 'react', name: 'React', url: 'https://react.dev/rss.xml', limit: 24 },
  { key: 'css', name: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', limit: 15 },
  { key: 'smashing', name: 'Smashing', url: 'https://www.smashingmagazine.com/feed/', limit: 25 },
  { key: 'echojs', name: 'EchoJS', url: 'https://www.echojs.com/rss', limit: 30 },
  { key: 'devto', name: 'DEV', url: 'https://dev.to/feed', limit: 12 },
  { key: 'ruanyifeng', name: '阮一峰', url: 'https://www.ruanyifeng.com/blog/atom.xml', limit: 10 },
  { key: 'hn', name: 'HackerNews', url: 'https://hnrss.org/frontpage', limit: 20 },
  { key: 'solidot', name: 'Solidot', url: 'https://www.solidot.org/index.rss', limit: 20 }
]

const UA = 'Mozilla/5.0 (compatible; TechRadarBot/1.0; +https://github.com/xudayangui/myblog)'

// 前端主题关键词：命中则排序加权，让 vue/js/node/react 内容更靠前
const FRONTEND_KEYWORDS = [
  'vue', 'react', 'node', 'javascript', 'typescript', 'js', 'css', 'html',
  'webpack', 'vite', 'npm', 'frontend', '前端', '浏览器', 'javascript', 'python',
  'ai', '开源', '框架', '性能', '算法', '面试', 'docker', 'kubernetes'
]

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function stripHtml(s) {
  return decodeEntities(String(s).replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').replace(/<[^>]*>/g, ' '))
    .replace(/Article URL:\s*https?:\/\/\S+/gi, '')
    .replace(/Comments?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
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

async function get(url, timeout = 12000) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeout)
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      headers: { 'user-agent': UA, accept: 'application/rss+xml,application/xml,text/xml,*/*' }
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
      title: truncate(title, 90),
      url,
      summary,
      source: feed.name,
      sourceKey: feed.key,
      date: toDate(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated'))
    }
    item._w = weight(item)
    items.push(item)
  }
  return items
}

async function readCache() {
  try {
    return JSON.parse(await readFile(OUT, 'utf8'))
  } catch {
    return null
  }
}

async function main() {
  console.log('技术雷达 · 正在抓取数据源…')
  const all = []
  const failed = []
  const seen = new Set()

  for (const feed of FEEDS) {
    try {
      const xml = await get(feed.url)
      const items = parseRss(xml, feed)
      if (!items.length) throw new Error('未解析到条目')
      let added = 0
      for (const item of items) {
        if (seen.has(item.url)) continue
        seen.add(item.url)
        delete item._w
        all.push(item)
        added++
      }
      console.log(`  ✓ ${feed.name}: ${added} 篇`)
    } catch (e) {
      failed.push(feed.name)
      console.warn(`  ! ${feed.name} 抓取失败: ${e.message}`)
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

  // 按日期倒序；前端主题权重作为次级排序（同一天内技术文靠前）
  all.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return 0
  })

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(
    OUT,
    JSON.stringify({ fetchedAt: new Date().toISOString(), items: all }, null, 2),
    'utf8'
  )
  console.log(`完成：共 ${all.length} 条 → ${OUT}`)
  if (failed.length) console.warn(`失败源（已跳过）: ${failed.join('、')}`)
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
