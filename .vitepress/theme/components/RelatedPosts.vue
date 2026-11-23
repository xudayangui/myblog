<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { data as posts } from '../posts.data.js'

const { frontmatter, page } = useData()

// 只在文章详情页渲染
const isPost = computed(() => String(page.value.relativePath || '').startsWith('docs/') && !!frontmatter.value.title)

// 相关文章：按标签重合度 + 同分类加权，取前 3 篇
const related = computed(() => {
  if (!isPost.value) return []
  const curTags = new Set((Array.isArray(frontmatter.value.tags) ? frontmatter.value.tags : [frontmatter.value.tags].filter(Boolean)) as string[])
  const curCats = (Array.isArray(frontmatter.value.categories) ? frontmatter.value.categories : [frontmatter.value.categories].filter(Boolean)) as string[]
  const curTitle = String(frontmatter.value.title || '')
  const curPath = String(page.value.relativePath || '')

  const scored = (posts as any[])
    .filter((p) => p.title !== curTitle && !curPath.includes(encodeURIComponent(String(p.title))))
    .map((p) => {
      let score = 0
      const pTags: string[] = p.tags || []
      for (const t of pTags) if (curTags.has(t)) score += 3
      const pCats: string[] = p.categories || []
      for (const c of pCats) if (curCats.includes(c)) score += 2
      return { post: p, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  return scored.map((x) => x.post)
})
</script>

<template>
  <section class="related-posts" v-if="related.length">
    <div class="related-head">
      <span class="related-kicker">KEEP READING</span>
      <h2>继续阅读</h2>
    </div>
    <div class="related-grid">
      <a v-for="post in related" :key="post.url" :href="post.url" class="related-card">
        <span class="related-cat">{{ post.categories?.[0] || post.tags?.[0] || '手记' }}</span>
        <h3>{{ post.title }}</h3>
        <span class="related-go" aria-hidden="true">↗</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.related-posts {
  margin-top: var(--yh-s16);
  padding-top: var(--yh-s6);
  border-top: 1px solid var(--yh-surface-3);
}
.related-head { margin-bottom: var(--yh-s6); }
.related-kicker {
  font-family: var(--yh-font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  color: var(--yh-accent);
}
.related-head h2 {
  margin: var(--yh-s2) 0 0;
  font-family: var(--yh-font-serif);
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--yh-n6);
}
.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--yh-s4);
}
.related-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--yh-s3);
  padding: var(--yh-s5);
  border: 1px solid var(--yh-surface-3);
  border-radius: 3px;
  text-decoration: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.related-card:hover { border-color: var(--yh-accent-line); background: var(--yh-surface-1); }
.related-cat {
  font-family: var(--yh-font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.06em;
  color: var(--yh-accent);
}
.related-card h3 {
  margin: 0;
  font-family: var(--yh-font-serif);
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.55;
  color: var(--yh-n6);
  padding-right: var(--yh-s4);
}
.related-card:hover h3 { color: var(--yh-accent); }
.related-go {
  position: absolute;
  top: var(--yh-s5);
  right: var(--yh-s5);
  color: var(--yh-n1);
  font-size: 0.85rem;
}
.related-card:hover .related-go { color: var(--yh-accent); }
</style>
