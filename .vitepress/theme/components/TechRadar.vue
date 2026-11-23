<script setup lang="ts">
import { computed, ref } from 'vue'
import feeds from '../feeds.data.json'

const activeSource = ref('all')
const search = ref('')

const sourceMeta: Record<string, { label: string; color: string }> = {
  juejin: { label: '掘金', color: '#3a7afe' },
  oschina: { label: 'OSCHINA', color: '#c0392b' },
  cnbeta: { label: 'cnBeta', color: '#d68910' },
  github: { label: 'GitHub', color: '#6c5ce7' },
  nodejs: { label: 'Node.js', color: '#68a063' },
  react: { label: 'React', color: '#61dafb' },
  css: { label: 'CSS-Tricks', color: '#ff7a59' },
  smashing: { label: 'Smashing', color: '#e8594a' },
  echojs: { label: 'EchoJS', color: '#8e7cc3' },
  devto: { label: 'DEV', color: '#333333' },
  ruanyifeng: { label: '阮一峰', color: '#2e8b57' },
  hn: { label: 'HackerNews', color: '#ff6600' },
  solidot: { label: 'Solidot', color: '#5a8f4e' }
}

const sources = computed(() => {
  const counts = new Map<string, number>()
  for (const item of feeds.items) counts.set(item.sourceKey, (counts.get(item.sourceKey) || 0) + 1)
  return [
    { key: 'all', label: '全部', count: feeds.items.length },
    ...[...counts.entries()]
      .map(([key, count]) => ({ key, label: sourceMeta[key]?.label || key, count }))
      .sort((a, b) => b.count - a.count)
  ]
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return feeds.items.filter((item: any) => {
    const matchSource = activeSource.value === 'all' || item.sourceKey === activeSource.value
    const matchQuery = !q || item.title.toLowerCase().includes(q) || (item.summary || '').toLowerCase().includes(q)
    return matchSource && matchQuery
  })
})

const fetchedDate = computed(() => {
  const d = new Date(feeds.fetchedAt)
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

function colorOf(key: string) {
  return sourceMeta[key]?.color || 'var(--yh-accent)'
}
function shortDate(d: string) {
  return d ? d.slice(5).replace('-', '.') : ''
}
</script>

<template>
  <div class="radar-page">
    <header class="radar-head">
      <p class="radar-eyebrow">TECH RADAR / 技术雷达</p>
      <h1>看见更多<span class="accent">好文章</span></h1>
      <p class="radar-intro">从掘金、OSCHINA、cnBeta、React、Node.js 等技术社区聚合的近期好文。只看元数据，点击标题跳转原文——尊重每一位作者的创作。</p>
      <div class="radar-sync">
        <span class="sync-dot"></span>
        已聚合 <b>{{ feeds.items.length }}</b> 篇 &nbsp;·&nbsp; 更新于 {{ fetchedDate }}
      </div>
    </header>

    <!-- 工具栏：来源筛选 + 搜索 -->
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
        >
          {{ src.label }} <span class="filter-count">{{ src.count }}</span>
        </button>
      </div>
      <label class="radar-search">
        <span aria-hidden="true">/</span>
        <input v-model="search" type="search" placeholder="搜索文章..." aria-label="搜索文章" />
      </label>
    </div>

    <!-- 文章列表：宽松信息流 -->
    <div class="radar-grid" v-if="filtered.length">
      <a
        v-for="(item, i) in filtered"
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
          </div>
          <h2 class="radar-card-title">{{ item.title }}</h2>
          <p class="radar-card-summary" v-if="item.summary">{{ item.summary }}</p>
        </div>
        <span class="radar-card-arrow" aria-hidden="true">↗</span>
      </a>
    </div>

    <div class="radar-empty" v-else>
      <span>// no results found</span>
      <p>没有匹配的文章，换个关键词或来源试试。</p>
    </div>

    <footer class="radar-footnote">
      <p>数据来源：掘金、OSCHINA、cnBeta、React、Node.js、CSS-Tricks 等公开 RSS 订阅源。本站仅展示标题与摘要，版权归原作者所有。</p>
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
.radar-intro { max-width: 60ch; margin: var(--yh-s5) 0 0; font-size: 0.92rem; line-height: 1.85; color: var(--yh-n3); }
.radar-sync {
  display: flex;
  align-items: center;
  gap: var(--yh-s2);
  margin-top: var(--yh-s5);
  font-family: var(--yh-font-mono);
  font-size: 0.72rem;
  color: var(--yh-n2);
}
.radar-sync b { color: var(--yh-accent); font-weight: 500; }
.sync-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--yh-accent); }

.radar-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--yh-s4);
  padding-bottom: var(--yh-s4);
  margin-bottom: var(--yh-s4);
  border-bottom: 1px solid var(--yh-n6);
}
.radar-filters { display: flex; flex-wrap: wrap; gap: var(--yh-s2); }
.radar-filter {
  font-family: var(--yh-font-mono);
  font-size: 0.72rem;
  padding: 5px 11px;
  border: 1px solid var(--yh-surface-3);
  border-radius: 2px;
  background: transparent;
  color: var(--yh-n3);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.radar-filter:hover { border-color: var(--yh-accent); color: var(--yh-accent); }
.radar-filter.active { background: var(--yh-accent); border-color: var(--yh-accent); color: #fff; }
html.dark .radar-filter.active { color: #1a1416; }
.filter-count { opacity: 0.65; margin-left: 3px; }
.radar-search {
  display: inline-flex;
  align-items: center;
  gap: var(--yh-s2);
  padding: 6px 10px;
  border: 1px solid var(--yh-surface-3);
  border-radius: 2px;
  font-family: var(--yh-font-mono);
}
.radar-search > span { color: var(--yh-accent); }
.radar-search input {
  border: 0; outline: 0; background: transparent;
  color: var(--yh-n5); font-family: var(--yh-font-mono); font-size: 0.75rem; width: 140px;
}
.radar-search input::placeholder { color: var(--yh-n2); }

/* 宽松单列信息流 */
.radar-grid { display: flex; flex-direction: column; }
.radar-card {
  display: flex;
  align-items: flex-start;
  gap: var(--yh-s5);
  padding: var(--yh-s6) var(--yh-s3);
  border-bottom: 1px solid var(--yh-surface-3);
  text-decoration: none;
  transition: background 0.2s ease;
}
.radar-card:hover { background: var(--yh-surface-1); }
.radar-card-body { flex: 1; min-width: 0; }
.radar-card-meta { display: flex; align-items: center; gap: var(--yh-s3); margin-bottom: var(--yh-s3); }
.radar-source {
  font-family: var(--yh-font-mono);
  font-size: 0.66rem;
  padding: 2px 8px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--src-color) 12%, transparent);
  color: var(--src-color);
  font-weight: 500;
}
html.dark .radar-source { background: color-mix(in srgb, var(--src-color) 22%, transparent); }
.radar-date { font-family: var(--yh-font-mono); font-size: 0.7rem; color: var(--yh-n2); }
.radar-card-title {
  margin: 0 0 var(--yh-s2);
  font-family: var(--yh-font-serif);
  font-size: 1.18rem;
  font-weight: 500;
  line-height: 1.5;
  color: var(--yh-n6);
  transition: color 0.2s ease;
}
.radar-card:hover .radar-card-title { color: var(--yh-accent); }
.radar-card-summary {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.75;
  color: var(--yh-n3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.radar-card-arrow { color: var(--yh-n1); font-size: 1rem; margin-top: var(--yh-s5); transition: color 0.2s ease, transform 0.2s ease; }
.radar-card:hover .radar-card-arrow { color: var(--yh-accent); transform: translate(2px, -2px); }

.radar-empty { padding: var(--yh-s16) var(--yh-s6); text-align: center; font-family: var(--yh-font-mono); color: var(--yh-n2); }
.radar-empty span { color: var(--yh-accent); }

.radar-footnote { margin-top: var(--yh-s16); padding-top: var(--yh-s5); border-top: 1px solid var(--yh-surface-3); font-size: 0.74rem; line-height: 1.8; color: var(--yh-n2); }
.radar-footnote p { margin: 0; }
.radar-footnote code { font-family: var(--yh-font-mono); color: var(--yh-accent); }

@media (max-width: 720px) {
  .radar-toolbar { flex-direction: column; align-items: stretch; }
  .radar-search input { width: 100%; }
  .radar-head { padding-top: var(--yh-s8); }
}
</style>
