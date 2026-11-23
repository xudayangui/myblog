<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import feeds from '../feeds.data.json'

const PAGE_SIZE = 20

const activeCategory = ref('all')
const activeSource = ref('all')
const sort = ref<'recommend' | 'latest'>('latest')
const search = ref('')
const page = ref(1)

// 分类维度（对应截图里掘金的「前端 / 后端 / AI」顶部分类）
const categoryTabs = [
  { key: 'all', label: '全部' },
  { key: 'frontend', label: '前端' },
  { key: 'backend', label: '后端' },
  { key: 'ai', label: '人工智能' },
  { key: 'repo', label: '代码仓库' },
  { key: 'news', label: '资讯' }
]

const sourceMeta: Record<string, { label: string; color: string }> = {
  juejin: { label: '掘金', color: '#3a7afe' },
  oschina: { label: 'OSCHINA', color: '#c0392b' },
  cnbeta: { label: 'cnBeta', color: '#d68910' },
  github: { label: 'GitHub', color: '#6c5ce7' },
  nodejs: { label: 'Node.js', color: '#68a063' },
  react: { label: 'React', color: '#61dafb' },
  vue: { label: 'Vue', color: '#42b883' },
  css: { label: 'CSS-Tricks', color: '#ff7a59' },
  smashing: { label: 'Smashing', color: '#e8594a' },
  echojs: { label: 'EchoJS', color: '#8e7cc3' },
  devto: { label: 'DEV', color: '#333333' },
  ruanyifeng: { label: '阮一峰', color: '#2e8b57' },
  hn: { label: 'HackerNews', color: '#ff6600' },
  solidot: { label: 'Solidot', color: '#5a8f4e' }
}

// 分类下可用的来源（来源筛选跟着分类联动）
const sources = computed(() => {
  const counts = new Map<string, number>()
  for (const item of feeds.items) {
    if (activeCategory.value !== 'all' && item.category !== activeCategory.value) continue
    counts.set(item.sourceKey, (counts.get(item.sourceKey) || 0) + 1)
  }
  return [
    { key: 'all', label: '全部来源', count: [...counts.values()].reduce((a, b) => a + b, 0) },
    ...[...counts.entries()]
      .map(([key, count]) => ({ key, label: sourceMeta[key]?.label || key, count }))
      .sort((a, b) => b.count - a.count)
  ]
})

const categoryCount = (key: string) =>
  key === 'all' ? feeds.items.length : feeds.items.filter((i: any) => i.category === key).length

// 先筛选、再排序
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = feeds.items.filter((item: any) => {
    const matchCat = activeCategory.value === 'all' || item.category === activeCategory.value
    const matchSource = activeSource.value === 'all' || item.sourceKey === activeSource.value
    const matchQuery = !q || item.title.toLowerCase().includes(q) || (item.summary || '').toLowerCase().includes(q)
    return matchCat && matchSource && matchQuery
  })
  if (sort.value === 'recommend') {
    // 推荐：仓库按 star 优先；文章优先有摘要 + 日期近的
    return [...list].sort((a: any, b: any) => {
      if (a.type === 'repo' && b.type === 'repo') return (b.stars || 0) - (a.stars || 0)
      const sa = (a.summary ? 1 : 0) * 10 + (a.date ? 1 : 0)
      const sb = (b.summary ? 1 : 0) * 10 + (b.date ? 1 : 0)
      if (sa !== sb) return sb - sa
      return a.date < b.date ? 1 : -1
    })
  }
  // 最新：按日期倒序
  return [...list].sort((a: any, b: any) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : 0))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const paged = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
const pages = computed(() => {
  const total = totalPages.value
  const cur = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const arr: (number | string)[] = [1]
  if (cur > 4) arr.push('…')
  const start = Math.max(2, cur - 2)
  const end = Math.min(total - 1, cur + 2)
  for (let i = start; i <= end; i++) arr.push(i)
  if (cur < total - 3) arr.push('…')
  arr.push(total)
  return arr
})

// 筛选条件变化时重置页码
watch([activeCategory, activeSource, sort, search], () => { page.value = 1 })

const fetchedDate = computed(() => {
  const d = new Date(feeds.fetchedAt)
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

function colorOf(key: string) { return sourceMeta[key]?.color || 'var(--yh-accent)' }
function shortDate(d: string) { return d ? d.slice(5).replace('-', '.') : '' }
function starText(n: number) { return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n) }
function goto(p: number) { if (typeof p === 'number' && p >= 1 && p <= totalPages.value) { page.value = p; scrollToList() } }
function scrollToList() {
  if (typeof window !== 'undefined') document.querySelector('.radar-list-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="radar-page">
    <header class="radar-head">
      <p class="radar-eyebrow">TECH RADAR / 技术雷达</p>
      <h1>看见更多<span class="accent">好文章</span></h1>
      <p class="radar-intro">从技术社区与代码仓库聚合的近期好文与热门项目。只看元数据，点击标题跳转原文——尊重每一位作者的创作。</p>
      <div class="radar-sync">
        <span class="sync-dot"></span>
        已聚合 <b>{{ feeds.items.length }}</b> 条 &nbsp;·&nbsp; 更新于 {{ fetchedDate }}
      </div>
    </header>

    <!-- 顶部分类栏（掘金式） -->
    <div class="radar-categories" role="tablist" aria-label="按分类筛选">
      <button
        v-for="tab in categoryTabs"
        :key="tab.key"
        class="radar-cat"
        :class="{ active: activeCategory === tab.key }"
        @click="activeCategory = tab.key"
        role="tab"
        :aria-selected="activeCategory === tab.key"
      >{{ tab.label }} <span class="cat-count">{{ categoryCount(tab.key) }}</span></button>
    </div>

    <!-- 工具栏：来源筛选 + 排序 + 搜索 -->
    <div class="radar-toolbar">
      <div class="radar-filters" role="tablist" aria-label="按来源筛选">
        <button
          v-for="src in sources"
          :key="src.key"
          class="radar-filter"
          :class="{ active: activeSource === src.key }"
          @click="activeSource = src.key"
          role="tab"
          :aria-selected="activeSource === src.key"
        >{{ src.label }} <span class="filter-count">{{ src.count }}</span></button>
      </div>
      <div class="radar-tools">
        <div class="radar-sort" role="group" aria-label="排序方式">
          <button :class="{ active: sort === 'recommend' }" @click="sort = 'recommend'">推荐</button>
          <button :class="{ active: sort === 'latest' }" @click="sort = 'latest'">最新</button>
        </div>
        <label class="radar-search">
          <span aria-hidden="true">/</span>
          <input v-model="search" type="search" placeholder="搜索..." aria-label="搜索" />
        </label>
      </div>
    </div>

    <div class="radar-list-anchor"></div>
    <p class="radar-result-count" v-if="filtered.length">
      共 <b>{{ filtered.length }}</b> 条 · 第 {{ page }} / {{ totalPages }} 页
    </p>

    <!-- 列表：文章 + 仓库卡片 -->
    <div class="radar-grid" v-if="paged.length">
      <a
        v-for="item in paged"
        :key="item.url"
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        class="radar-card"
      >
        <div class="radar-card-body">
          <div class="radar-card-meta">
            <span class="radar-source" :style="{ '--src-color': colorOf(item.sourceKey) }">{{ item.source }}</span>
            <span class="radar-date" v-if="item.date">{{ shortDate(item.date) }}</span>
            <template v-if="item.type === 'repo'">
              <span class="repo-star" v-if="item.stars">★ {{ starText(item.stars) }}</span>
              <span class="repo-lang" v-if="item.language"><i class="lang-dot"></i>{{ item.language }}</span>
            </template>
          </div>
          <h2 class="radar-card-title">{{ item.title }}</h2>
          <p class="radar-card-summary" v-if="item.summary">{{ item.summary }}</p>
        </div>
        <span class="radar-card-arrow" aria-hidden="true">↗</span>
      </a>
    </div>

    <div class="radar-empty" v-else>
      <span>// no results found</span>
      <p>没有匹配的内容，换个关键词或分类试试。</p>
    </div>

    <!-- 分页 -->
    <nav class="radar-pagination" v-if="totalPages > 1" aria-label="分页">
      <button class="page-btn" :disabled="page === 1" @click="goto(page - 1)" aria-label="上一页">←</button>
      <template v-for="(p, i) in pages" :key="i">
        <span class="page-ellipsis" v-if="p === '…'">…</span>
        <button v-else class="page-num" :class="{ active: p === page }" @click="goto(p as number)">{{ p }}</button>
      </template>
      <button class="page-btn" :disabled="page === totalPages" @click="goto(page + 1)" aria-label="下一页">→</button>
    </nav>

    <footer class="radar-footnote">
      <p>数据来源：掘金、OSCHINA、cnBeta、React、Vue、Node.js、GitHub 等公开 RSS 与仓库 API。本站仅展示元数据，版权归原作者所有。</p>
      <p>数据由 <code>scripts/fetch-feeds.mjs</code> 在构建时自动抓取更新。</p>
    </footer>
  </div>
</template>

<style scoped>
.radar-page { --edge: clamp(1.25rem, 5vw, 3rem); padding: 0 var(--edge) var(--yh-s24); max-width: 960px; margin: 0 auto; }
.radar-head { padding: var(--yh-s12) 0 var(--yh-s8); }
.radar-eyebrow {
  margin: 0 0 var(--yh-s5);
  font-family: var(--yh-font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  color: var(--yh-accent);
  text-transform: uppercase;
}
.radar-head h1 {
  margin: 0;
  font-family: var(--yh-font-serif);
  font-size: clamp(2.2rem, 6vw, 3.4rem);
  font-weight: 400;
  letter-spacing: -0.03em;
  line-height: 1.3;
  color: var(--yh-n6);
}
.radar-head h1 .accent { color: var(--yh-accent); }
.radar-intro { max-width: 62ch; margin: var(--yh-s5) 0 0; font-size: 0.92rem; line-height: 1.85; color: var(--yh-n3); }
.radar-sync {
  display: flex; align-items: center; gap: var(--yh-s2);
  margin-top: var(--yh-s5);
  font-family: var(--yh-font-mono); font-size: 0.72rem; color: var(--yh-n2);
}
.radar-sync b { color: var(--yh-accent); font-weight: 500; }
.sync-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--yh-accent); }

/* 顶部分类栏 */
.radar-categories {
  display: flex; flex-wrap: wrap; gap: var(--yh-s1);
  padding-bottom: var(--yh-s4);
  border-bottom: 1px solid var(--yh-surface-3);
}
.radar-cat {
  font-size: 0.88rem; padding: 8px 16px;
  border: 0; border-radius: 2px; background: transparent;
  color: var(--yh-n3); cursor: pointer;
  transition: color 0.2s, background 0.2s;
  white-space: nowrap;
}
.radar-cat:hover { color: var(--yh-accent); background: var(--yh-surface-1); }
.radar-cat.active { color: var(--yh-accent); font-weight: 600; background: var(--yh-surface-1); }
.cat-count { font-family: var(--yh-font-mono); font-size: 0.68rem; color: var(--yh-n2); margin-left: 2px; }
.radar-cat.active .cat-count { color: var(--yh-accent); }

/* 工具栏 */
.radar-toolbar {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: var(--yh-s4); padding: var(--yh-s4) 0; margin-bottom: var(--yh-s2);
  border-bottom: 1px solid var(--yh-surface-3);
}
.radar-filters { display: flex; flex-wrap: wrap; gap: var(--yh-s2); }
.radar-filter {
  font-family: var(--yh-font-mono); font-size: 0.7rem; padding: 5px 10px;
  border: 1px solid var(--yh-surface-3); border-radius: 2px;
  background: transparent; color: var(--yh-n3); cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.radar-filter:hover { border-color: var(--yh-accent); color: var(--yh-accent); }
.radar-filter.active { background: var(--yh-accent); border-color: var(--yh-accent); color: #fff; }
html.dark .radar-filter.active { color: #1a1416; }
.filter-count { opacity: 0.65; margin-left: 3px; }
.radar-tools { display: flex; align-items: center; gap: var(--yh-s3); }
.radar-sort { display: inline-flex; border: 1px solid var(--yh-surface-3); border-radius: 2px; overflow: hidden; }
.radar-sort button {
  font-size: 0.74rem; padding: 6px 12px; border: 0; background: transparent;
  color: var(--yh-n3); cursor: pointer; transition: color 0.2s, background 0.2s;
}
.radar-sort button + button { border-left: 1px solid var(--yh-surface-3); }
.radar-sort button.active { color: var(--yh-accent); background: var(--yh-surface-1); font-weight: 600; }
.radar-search {
  display: inline-flex; align-items: center; gap: var(--yh-s2);
  padding: 6px 10px; border: 1px solid var(--yh-surface-3); border-radius: 2px;
  font-family: var(--yh-font-mono);
}
.radar-search > span { color: var(--yh-accent); }
.radar-search input {
  border: 0; outline: 0; background: transparent;
  color: var(--yh-n5); font-family: var(--yh-font-mono); font-size: 0.75rem; width: 120px;
}
.radar-search input::placeholder { color: var(--yh-n2); }

.radar-list-anchor { scroll-margin-top: 20px; }
.radar-result-count { margin: var(--yh-s4) 0 0; font-family: var(--yh-font-mono); font-size: 0.72rem; color: var(--yh-n2); }
.radar-result-count b { color: var(--yh-accent); font-weight: 500; }

/* 宽松单列信息流 */
.radar-grid { display: flex; flex-direction: column; }
.radar-card {
  display: flex; align-items: flex-start; gap: var(--yh-s5);
  padding: var(--yh-s6) var(--yh-s3);
  border-bottom: 1px solid var(--yh-surface-3);
  text-decoration: none; transition: background 0.2s ease;
}
.radar-card:hover { background: var(--yh-surface-1); }
.radar-card-body { flex: 1; min-width: 0; }
.radar-card-meta { display: flex; align-items: center; flex-wrap: wrap; gap: var(--yh-s3); margin-bottom: var(--yh-s3); }
.radar-source {
  font-family: var(--yh-font-mono); font-size: 0.66rem; padding: 2px 8px;
  border-radius: 2px; background: color-mix(in srgb, var(--src-color) 12%, transparent);
  color: var(--src-color); font-weight: 500;
}
html.dark .radar-source { background: color-mix(in srgb, var(--src-color) 22%, transparent); }
.radar-date { font-family: var(--yh-font-mono); font-size: 0.7rem; color: var(--yh-n2); }
.repo-star { font-family: var(--yh-font-mono); font-size: 0.7rem; color: #c9932a; font-weight: 600; }
.repo-lang { font-family: var(--yh-font-mono); font-size: 0.68rem; color: var(--yh-n3); display: inline-flex; align-items: center; gap: 4px; }
.lang-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--yh-n2); display: inline-block; }
.radar-card-title {
  margin: 0 0 var(--yh-s2); font-family: var(--yh-font-serif); font-size: 1.18rem;
  font-weight: 500; line-height: 1.5; color: var(--yh-n6); transition: color 0.2s ease;
}
.radar-card:hover .radar-card-title { color: var(--yh-accent); }
.radar-card-summary {
  margin: 0; font-size: 0.85rem; line-height: 1.75; color: var(--yh-n3);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.radar-card-arrow { color: var(--yh-n1); font-size: 1rem; margin-top: var(--yh-s5); transition: color 0.2s ease, transform 0.2s ease; }
.radar-card:hover .radar-card-arrow { color: var(--yh-accent); transform: translate(2px, -2px); }

.radar-empty { padding: var(--yh-s16) var(--yh-s6); text-align: center; font-family: var(--yh-font-mono); color: var(--yh-n2); }
.radar-empty span { color: var(--yh-accent); }

/* 分页 */
.radar-pagination {
  display: flex; align-items: center; justify-content: center; flex-wrap: wrap;
  gap: var(--yh-s2); margin-top: var(--yh-s10); padding-top: var(--yh-s6);
  border-top: 1px solid var(--yh-surface-3);
}
.radar-pagination button {
  font-family: var(--yh-font-mono); font-size: 0.78rem; min-width: 34px; height: 34px;
  border: 1px solid var(--yh-surface-3); border-radius: 2px; background: transparent;
  color: var(--yh-n3); cursor: pointer; transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.radar-pagination button:hover:not(:disabled):not(.active) { border-color: var(--yh-accent); color: var(--yh-accent); }
.radar-pagination button.active { background: var(--yh-accent); border-color: var(--yh-accent); color: #fff; }
html.dark .radar-pagination button.active { color: #1a1416; }
.radar-pagination button:disabled { opacity: 0.35; cursor: not-allowed; }
.page-ellipsis { color: var(--yh-n2); padding: 0 2px; font-family: var(--yh-font-mono); }

.radar-footnote { margin-top: var(--yh-s16); padding-top: var(--yh-s5); border-top: 1px solid var(--yh-surface-3); font-size: 0.74rem; line-height: 1.8; color: var(--yh-n2); }
.radar-footnote p { margin: 0; }
.radar-footnote code { font-family: var(--yh-font-mono); color: var(--yh-accent); }

@media (max-width: 720px) {
  .radar-toolbar { flex-direction: column; align-items: stretch; }
  .radar-tools { justify-content: space-between; }
  .radar-search input { width: 100px; }
  .radar-head { padding-top: var(--yh-s8); }
  .radar-cat { padding: 7px 11px; font-size: 0.82rem; }
  .radar-card-title { font-size: 1.08rem; }
}
</style>
