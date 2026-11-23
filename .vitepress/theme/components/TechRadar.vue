<script setup lang="ts">
import { computed, ref } from 'vue'
import feeds from '../feeds.data.json'

const activeSource = ref('all')
const search = ref('')

const sourceMeta: Record<string, { label: string; color: string }> = {
  juejin: { label: '掘金', color: '#3a7afe' },
  oschina: { label: 'OSCHINA', color: '#c0392b' },
  cnbeta: { label: 'cnBeta', color: '#d68910' },
  github: { label: 'GitHub', color: '#6c5ce7' }
}

const sources = computed(() => {
  const counts = new Map<string, number>()
  for (const item of feeds.items) counts.set(item.sourceKey, (counts.get(item.sourceKey) || 0) + 1)
  return [
    { key: 'all', label: '全部', count: feeds.items.length },
    ...[...counts.entries()].map(([key, count]) => ({
      key,
      label: sourceMeta[key]?.label || key,
      count
    }))
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
  return sourceMeta[key]?.color || 'var(--pj-seal)'
}
</script>

<template>
  <div class="radar-page">
    <!-- 终端风格标题区 -->
    <div class="radar-terminal">
      <div class="radar-term-line"><span class="t-user">dayangui</span>@<span class="t-host">blog</span>:~$ <span class="t-cmd">fetch --sources juejin,oschina,cnbeta</span></div>
      <div class="radar-term-line t-dim">› Aggregating feeds from tech communities...</div>
      <div class="radar-term-line t-ok">✓ Loaded {{ feeds.items.length }} articles &nbsp;·&nbsp; synced {{ fetchedDate }}</div>
    </div>

    <header class="radar-head">
      <h1>技术雷达<span class="dot">.</span></h1>
      <p>从各大技术社区聚合的近期好文，点击标题跳转原文。只看元数据，不搬运正文——尊重每一位作者的创作。</p>
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

    <!-- 文章列表 -->
    <div class="radar-grid" v-if="filtered.length">
      <a
        v-for="(item, i) in filtered"
        :key="item.url"
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        class="radar-card"
      >
        <div class="radar-card-top">
          <span class="radar-index">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="radar-source" :style="{ '--src-color': colorOf(item.sourceKey) }">{{ item.source }}</span>
          <span class="radar-date" v-if="item.date">{{ item.date.slice(5) }}</span>
        </div>
        <h2 class="radar-card-title">{{ item.title }}</h2>
        <p class="radar-card-summary" v-if="item.summary">{{ item.summary }}</p>
        <div class="radar-card-foot">
          <span class="radar-external">阅读原文 <span aria-hidden="true">↗</span></span>
        </div>
      </a>
    </div>

    <div class="radar-empty" v-else>
      <span>// no results found</span>
      <p>没有匹配的文章，换个关键词或来源试试。</p>
    </div>

    <footer class="radar-footnote">
      <p>数据来源：掘金、OSCHINA、cnBeta 等公开 RSS 订阅源。本站仅展示标题与摘要，版权归原作者所有。</p>
      <p>数据由 <code>scripts/fetch-feeds.mjs</code> 在构建时自动抓取更新。</p>
    </footer>
  </div>
</template>

<style scoped>
.radar-page { --edge: clamp(1.25rem, 5vw, 4.5rem); padding: 0 var(--edge) var(--pj-s24); }

.radar-terminal {
  padding: var(--pj-s6);
  margin: var(--pj-s8) 0 var(--pj-s12);
  border: 1px solid var(--pj-rule);
  border-radius: 3px;
  background: var(--pj-paper-2);
  font-family: var(--pj-font-mono);
  font-size: 0.78rem;
  line-height: 1.9;
  overflow-x: auto;
}
.radar-term-line { white-space: nowrap; }
.t-user { color: var(--pj-seal); font-weight: 600; }
.t-host { color: var(--pj-ink-2); }
.t-cmd { color: var(--pj-ink); }
.t-dim { color: var(--pj-ink-3); }
.t-ok { color: #1d9e75; }

.radar-head { margin-bottom: var(--pj-s12); }
.radar-head h1 {
  margin: 0 0 var(--pj-s4);
  font-family: var(--pj-font-display);
  font-size: clamp(2.6rem, 7vw, 4.5rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--pj-ink);
}
.radar-head h1 .dot { color: var(--pj-seal); }
.radar-head p { max-width: 60ch; margin: 0; font-size: 0.95rem; line-height: 1.9; color: var(--pj-ink-2); }

.radar-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--pj-s4);
  padding-bottom: var(--pj-s4);
  margin-bottom: var(--pj-s8);
  border-bottom: 2px solid var(--pj-ink);
}
.radar-filters { display: flex; flex-wrap: wrap; gap: 6px; }
.radar-filter {
  font-family: var(--pj-font-mono);
  font-size: 0.78rem;
  padding: 6px 12px;
  border: 1px solid var(--pj-rule);
  border-radius: 3px;
  background: transparent;
  color: var(--pj-ink-2);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.radar-filter:hover { border-color: var(--pj-seal); color: var(--pj-seal); }
.radar-filter.active { background: var(--pj-seal); border-color: var(--pj-seal); color: #fff; }
.filter-count { opacity: 0.7; margin-left: 2px; }
.radar-search {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--pj-rule);
  border-radius: 3px;
  background: var(--pj-paper);
  font-family: var(--pj-font-mono);
}
.radar-search > span { color: var(--pj-seal); }
.radar-search input {
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--pj-ink);
  font-family: var(--pj-font-mono);
  font-size: 0.78rem;
  width: 150px;
}
.radar-search input::placeholder { color: var(--pj-ink-3); }

.radar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--pj-s6);
}
.radar-card {
  display: flex;
  flex-direction: column;
  padding: var(--pj-s6);
  border: 1px solid var(--pj-rule);
  border-radius: 3px;
  background: var(--pj-paper);
  text-decoration: none;
  transition: border-color 0.25s, transform 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}
.radar-card:hover { border-color: var(--pj-seal); transform: translateY(-3px); }
.radar-card-top { display: flex; align-items: center; gap: 10px; margin-bottom: var(--pj-s4); }
.radar-index { font-family: var(--pj-font-mono); font-size: 0.72rem; color: var(--pj-rule-strong); }
.radar-source {
  font-family: var(--pj-font-mono);
  font-size: 0.7rem;
  padding: 2px 8px;
  border: 1px solid var(--src-color);
  border-radius: 999px;
  color: var(--src-color);
}
.radar-date { margin-left: auto; font-family: var(--pj-font-mono); font-size: 0.72rem; color: var(--pj-ink-3); }
.radar-card-title {
  margin: 0 0 var(--pj-s3);
  font-family: var(--pj-font-display);
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.5;
  color: var(--pj-ink);
  transition: color 0.2s;
}
.radar-card:hover .radar-card-title { color: var(--pj-seal); }
.radar-card-summary {
  margin: 0 0 var(--pj-s4);
  font-size: 0.84rem;
  line-height: 1.75;
  color: var(--pj-ink-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.radar-card-foot { margin-top: auto; padding-top: var(--pj-s3); border-top: 1px solid var(--pj-rule); }
.radar-external { font-family: var(--pj-font-mono); font-size: 0.74rem; color: var(--pj-seal); }

.radar-empty {
  padding: var(--pj-s16) var(--pj-s6);
  text-align: center;
  font-family: var(--pj-font-mono);
  color: var(--pj-ink-3);
}
.radar-empty span { color: var(--pj-seal); }
.radar-empty p { font-family: var(--pj-font-body); }

.radar-footnote {
  margin-top: var(--pj-s16);
  padding-top: var(--pj-s6);
  border-top: 1px solid var(--pj-rule);
  font-size: 0.76rem;
  line-height: 1.8;
  color: var(--pj-ink-3);
}
.radar-footnote p { margin: 0; }
.radar-footnote code { font-family: var(--pj-font-mono); color: var(--pj-seal); }

@media (max-width: 720px) {
  .radar-toolbar { flex-direction: column; align-items: stretch; }
  .radar-search input { width: 100%; }
  .status-stats { margin-left: 0; padding-left: 0; border-left: 0; width: 100%; }
}
</style>
