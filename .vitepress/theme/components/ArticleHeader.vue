<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter, page } = useData()

const date = computed(() => {
  const d = frontmatter.value.date
  if (!d) return ''
  if (d instanceof Date) {
    return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`
  }
  return String(d).slice(0, 10).replaceAll('-', '.')
})

const categories = computed(() => {
  const c = frontmatter.value.categories
  if (!c) return []
  return Array.isArray(c) ? c : [c]
})

const tags = computed(() => {
  const t = frontmatter.value.tags
  if (!t) return []
  return Array.isArray(t) ? t : [t]
})

// 阅读时长估算：中文约 400 字/分钟，英文约 200 词/分钟
const readingTime = computed(() => {
  const src = String((page.value as any).src || '')
  const plain = src
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]*>/g, '')
  const cjk = (plain.match(/[\u4e00-\u9fff]/g) || []).length
  const latin = (plain.match(/[a-zA-Z]+/g) || []).length
  const minutes = Math.max(1, Math.ceil(cjk / 400 + latin / 200))
  return minutes
})

const title = computed(() => frontmatter.value.title || '')

const hasMeta = computed(() => date.value || categories.value.length || tags.value.length || title.value)
</script>

<template>
  <div class="article-header" v-if="hasMeta">
    <h1 class="article-title" v-if="title">{{ title }}</h1>
    <div class="article-kicker">
      <span v-if="categories.length" class="article-cat">{{ categories[0] }}</span>
      <span class="article-sep" v-if="categories.length && date">/</span>
      <span v-if="date" class="article-date">{{ date }}</span>
      <span class="article-sep" v-if="date">/</span>
      <span class="article-read">{{ readingTime }} min read</span>
    </div>
    <div class="article-rule"></div>
    <div class="article-tags" v-if="tags.length">
      <span class="article-tag" v-for="tag in tags" :key="tag"># {{ tag }}</span>
    </div>
  </div>
</template>

<style scoped>
.article-header { margin: 0 0 var(--yh-s10); }
.article-title {
  font-family: var(--yh-font-serif);
  font-size: 40px;
  font-weight: 400;
  letter-spacing: -0.03em;
  line-height: 1.4;
  color: var(--yh-n6);
  margin: 0 0 var(--yh-s6);
}
.article-kicker {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--yh-s3);
  font-family: var(--yh-font-mono);
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  color: var(--yh-n2);
}
.article-cat { color: var(--yh-accent); }
.article-sep { color: var(--yh-n1); }
.article-date, .article-read { color: var(--yh-n2); }
.article-rule { width: 24px; height: 2px; background: var(--yh-accent); margin: var(--yh-s5) 0; }
.article-tags { display: flex; flex-wrap: wrap; gap: var(--yh-s2); }
.article-tag {
  font-family: var(--yh-font-mono);
  font-size: 0.7rem;
  color: var(--yh-n3);
  padding: 2px 8px;
  border: 1px solid var(--yh-surface-3);
  border-radius: 2px;
}
</style>
