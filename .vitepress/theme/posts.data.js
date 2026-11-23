import { createContentLoader } from 'vitepress'

// 与 .vitepress/config.mts 中的 base 保持一致
const BASE = '/myblog'

export default createContentLoader('docs/**/*.md', {
  excerpt: true,
  transform(raw) {
    return raw
      .map(({ url, frontmatter, excerpt }) => {
        const fm = frontmatter || {}
        return {
          url: BASE + url,
          title: fm.title || url.split('/').pop(),
          date: normalizeDate(fm.date),
          tags: toArray(fm.tags),
          categories: toArray(fm.categories),
          excerpt: excerpt || ''
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
