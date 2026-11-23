/**
 * 技术雷达 · 数据源抓取脚本
 *
 * 从各大技术站点的公开 RSS / Trending 页抓取文章元数据（标题 / 链接 / 摘要 / 来源 / 时间），
 * 聚合到 .vitepress/theme/feeds.data.json，供「技术雷达」页面展示。
 *
 * 设计原则：
 * - 只抓元数据，不存正文。点击跳转原文，尊重版权与原作者。
 * - 任一源失败不影响其他源；全部失败时保留上一次的缓存数据。
 * - 无任何第三方依赖，仅用 Node 内置 fetch。
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, '.vitepress/theme/feeds.data.json')
const PER_SOURCE = 7

const FEEDS = [
  { key: 'juejin', name: '掘金', url: 'https://juejin.cn/rss' },
  { key: 'oschina', name: 'OSCHINA', url: 'https://www.oschina.net/news/rss' },
  { key: 'cnbeta', name: 'cnBeta', url: 'https://rss.cnbeta.com.tw/rss' }
]

const UA = 'Mozilla/5.0 (compatible; TechRadarBot/1.0; +https://github.com/xudayangui/myblog)'

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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function stripHtml(s) {
  return decodeEntities(String(s).replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').replace(/<[^>]*>/g, ' '))
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

function truncate(s, n = 110) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s
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
  while ((m = re.exec(xml)) && items.length < PER_SOURCE) {
    const b = m[0]
    const title = tag(b, 'title')
    const url = link(b)
    if (!title || !/^https?:\/\//.test(url)) continue
    items.push({
      title: truncate(title, 80),
      url,
      summary: truncate(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content')),
      source: feed.name,
      sourceKey: feed.key,
      date: toDate(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated'))
    })
  }
  return items
}

async function fetchGithubTrending(limit = 6) {
  try {
    const html = await get('https://github.com/trending?since=daily', 20000)
    const items = []
    const re = /<h2 class="h3 lh-condensed">\s*<a[^>]*href="\/([^"/]+)\/([^"/]+)"[^>]*>[\s\S]*?<\/a>[\s\S]{0,1200}?<p class="col-9 color-fg-muted my-1 pr-4">([\s\S]*?)<\/p>/g
    let m
    while ((m = re.exec(html)) && items.length < limit) {
      const owner = m[1].trim()
      const repo = m[2].trim()
      const desc = stripHtml(m[3])
      items.push({
        title: `${owner} / ${repo}`,
        url: `https://github.com/${owner}/${repo}`,
        summary: truncate(desc || 'GitHub 今日热门开源项目'),
        source: 'GitHub',
        sourceKey: 'github',
        date: new Date().toISOString().slice(0, 10)
      })
    }
    return items
  } catch (e) {
    console.warn(`  ! GitHub Trending 抓取失败: ${e.message}`)
    return []
  }
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

  for (const feed of FEEDS) {
    try {
      const xml = await get(feed.url)
      const items = parseRss(xml, feed)
      if (!items.length) throw new Error('未解析到条目')
      all.push(...items)
      console.log(`  ✓ ${feed.name}: ${items.length} 篇`)
    } catch (e) {
      failed.push(feed.name)
      console.warn(`  ! ${feed.name} 抓取失败: ${e.message}`)
    }
  }

  const gh = await fetchGithubTrending()
  if (gh.length) {
    all.push(...gh)
    console.log(`  ✓ GitHub Trending: ${gh.length} 个`)
  }

  if (!all.length) {
    const cache = await readCache()
    if (cache?.items?.length) {
      console.warn('所有数据源均失败，保留上次缓存数据。')
      return
    }
    throw new Error('所有数据源均失败且无缓存')
  }

  all.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

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
