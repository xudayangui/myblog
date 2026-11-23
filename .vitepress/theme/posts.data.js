import { createContentLoader } from 'vitepress'

export default createContentLoader('docs/**/*.md', {
  excerpt: false,
  transform(raw) {
    return raw
      .map(({ url, frontmatter }) => {
        const fm = frontmatter || {}
        return {
          url,
          title: fm.title || url.split('/').pop(),
          date: normalizeDate(fm.date),
          tags: toArray(fm.tags),
          categories: toArray(fm.categories)
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
