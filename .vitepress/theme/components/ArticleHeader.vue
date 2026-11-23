<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter } = useData()

const date = computed(() => {
  const d = frontmatter.value.date
  if (!d) return ''
  if (d instanceof Date) {
    return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`
  }
  return String(d).slice(0, 10).replaceAll('-', '.')
})

const tags = computed(() => {
  const t = frontmatter.value.tags
  if (!t) return []
  return Array.isArray(t) ? t : [t]
})
</script>

<template>
  <div class="article-header" v-if="date || tags.length">
    <div class="article-header-rule"></div>
    <div class="article-header-meta">
      <span v-if="date" class="article-date">{{ date }}</span>
      <span v-if="tags.length" class="article-tags">
        <span class="article-tag" v-for="tag in tags" :key="tag">{{ tag }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.article-header { margin: 0 0 var(--pj-s8); }
.article-header-rule {
  width: 48px;
  height: 3px;
  background: var(--pj-seal);
  margin-bottom: var(--pj-s6);
}
.article-header-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--pj-s4);
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  color: var(--pj-ink-3);
}
.article-date { font-family: var(--pj-font-display); font-variant-numeric: tabular-nums; }
.article-tag {
  display: inline-block;
  padding: 2px 10px;
  border: 1px solid var(--pj-rule-strong);
  border-radius: 999px;
  font-size: 0.72rem;
  color: var(--pj-seal);
}
</style>
