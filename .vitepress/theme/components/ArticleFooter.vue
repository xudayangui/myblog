<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { data as posts } from '../posts.data.js'

const { page } = useData()

// posts 已按日期倒序排列；用 url 定位当前文章，取相邻两篇
function normalize(u: string) {
  return String(u).replace(/^\/myblog/, '').replace(/\.html$/, '').replace(/\/$/, '')
}

const neighbors = computed(() => {
  const list = posts as any[]
  const curPath = normalize(page.value.path || '')
  const curTitle = String(page.value.frontmatter?.title || '')
  // 优先用 path 匹配，其次用 title（SSR 阶段 path 可能尚未就绪）
  let idx = list.findIndex((p) => normalize(p.url) === curPath)
  if (idx < 0 && curTitle) idx = list.findIndex((p) => p.title === curTitle)
  if (idx < 0) return { prev: null, next: null }
  return { prev: list[idx - 1] || null, next: list[idx + 1] || null }
})
</script>

<template>
  <nav class="article-pager" v-if="neighbors.prev || neighbors.next">
    <a v-if="neighbors.prev" :href="neighbors.prev.url" class="pager-item pager-prev">
      <span class="pager-label">← 上一篇</span>
      <span class="pager-title">{{ neighbors.prev.title }}</span>
    </a>
    <span v-else class="pager-item pager-empty"></span>
    <a v-if="neighbors.next" :href="neighbors.next.url" class="pager-item pager-next">
      <span class="pager-label">下一篇 →</span>
      <span class="pager-title">{{ neighbors.next.title }}</span>
    </a>
    <span v-else class="pager-item pager-empty"></span>
  </nav>
</template>

<style scoped>
.article-pager {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--yh-s4);
  margin-top: var(--yh-s16);
  padding-top: var(--yh-s6);
  border-top: 1px solid var(--yh-surface-3);
}
.pager-item {
  display: flex;
  flex-direction: column;
  gap: var(--yh-s2);
  padding: var(--yh-s5);
  border: 1px solid var(--yh-surface-3);
  border-radius: 3px;
  text-decoration: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}
a.pager-item:hover { border-color: var(--yh-accent-line); background: var(--yh-surface-1); }
.pager-next { text-align: right; align-items: flex-end; }
.pager-empty { border: 0; background: transparent; }
.pager-label {
  font-family: var(--yh-font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  color: var(--yh-accent);
}
.pager-title {
  font-family: var(--yh-font-serif);
  font-size: 0.98rem;
  font-weight: 400;
  line-height: 1.5;
  color: var(--yh-n6);
}
a.pager-item:hover .pager-title { color: var(--yh-accent); }
@media (max-width: 720px) {
  .article-pager { grid-template-columns: 1fr; }
  .pager-next { text-align: left; align-items: flex-start; }
}
</style>
