import { createContentLoader } from 'vitepress'
import { readFileSync } from 'node:fs'

// 与 .vitepress/config.mts 中的 base 保持一致
const BASE = '/myblog'

export default createContentLoader('docs/**/*.md', {
  excerpt: true,
  transform(raw) {
    return raw
      .map(({ url, frontmatter, excerpt }) => {
        const fm = frontmatter || {}
        // 从 url 反推源文件路径，读取全文统计字数（createContentLoader 的 raw 项不含完整正文）
        let wordCount = 0
        try {
          const rel = String(url).replace(/^\//, '').replace(/\.html$/, '')
          wordCount = countWords(readFileSync(`${rel}.md`, 'utf8'))
        } catch { /* 读取失败则字数记 0 */ }
        return {
          url: BASE + url,
          title: fm.title || url.split('/').pop(),
          date: normalizeDate(fm.date),
          tags: toArray(fm.tags),
          categories: toArray(fm.categories),
          excerpt: excerpt || '',
          wordCount
        }
      })
      .filter((post) => post.date)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }
})

function toArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

// 统计正文字数：中文按字、英文按词，用于阅读时长估算
function countWords(markdown) {
  const plain = String(markdown)
    .replace(/^---[\s\S]*?---/, '')       // 去 frontmatter
    .replace(/```[\s\S]*?```/g, '')        // 去代码块
    .replace(/`[^`]*`/g, '')               // 去行内代码
    .replace(/<[^>]*>/g, '')               // 去 HTML 标签
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // 保留链接/图片文字
    .replace(/[#*>\-|]/g, ' ')             // 去 Markdown 标记
  const cjk = (plain.match(/[\u4e00-\u9fff]/g) || []).length
  const latin = (plain.match(/[a-zA-Z]+/g) || []).length
  return cjk + latin
}

function normalizeDate(value) {
  if (!value) return ''
  if (value instanceof Date) {
    const y = value.getUTCFullYear()
    const m = String(value.getUTCMonth() + 1).padStart(2, '0')
    const d = String(value.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return String(value).slice(0, 10)
}
