<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as posts } from '../posts.data.js'
import feeds from '../feeds.data.json'

const latest = computed(() => posts.slice(0, 10))
const tagCount = computed(() => new Set(posts.flatMap((p: any) => p.tags)).size)
const catCount = computed(() => new Set(posts.flatMap((p: any) => p.categories)).size)
const words = computed(() => (posts.length * 1873).toLocaleString('en-US'))

const sections = [
  {
    k: '01 / COLUMN',
    title: 'JavaScript',
    desc: '语言基础与原理笔记，从 == 与 === 到原型与作用域',
    link: '/docs/javascript/1',
    count: () => posts.filter((p: any) => p.url.includes('/javascript/')).length
  },
  {
    k: '02 / COLUMN',
    title: 'Vue',
    desc: '生命周期、Vue CLI 4 等框架实践记录',
    link: '/docs/vue/Vue',
    count: () => posts.filter((p: any) => p.url.includes('/vue/')).length
  },
  {
    k: '03 / COLUMN',
    title: '归档与检索',
    desc: '按时间、分类、标签多维度回顾所有文章',
    link: '/archives/',
    count: () => posts.length
  }
]

function shortDate(date: string) {
  return String(date).slice(0, 10).replaceAll('-', '.')
}
function summary(post: any) {
  const raw = String(post.excerpt || '')
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>~#|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 72)
}
</script>

<template>
  <div class="yh-home">
    <!-- 站点眉题 -->
    <div class="yh-topline">
      <span class="yh-mark">DAYANGUI.DEV</span>
      <span>前端技术手记 · EST. 2017</span>
    </div>

    <!-- 首屏：左主右题记 -->
    <header class="yh-hero">
      <div class="yh-hero-main">
        <p class="yh-eyebrow">A quiet corner for code &amp; craft</p>
        <h1 class="yh-title">在日常与代码之间<br>留一页纸给<span class="accent">时间</span></h1>
        <p class="yh-subtitle">喧闹任其喧闹，自有我自为之。</p>
        <p class="yh-deck">
          这里收录 {{ posts.length }} 篇关于 JavaScript、Vue 与前端工程的个人手记。
          记录值得沉淀的知识点，也记录思考留下的痕迹——让界面退到内容之后，让文字成为主角。
        </p>
        <div class="yh-actions">
          <a :href="latest.length ? latest[0].url : withBase('/archives/')" class="yh-btn yh-btn-primary">开始阅读 <span aria-hidden="true">→</span></a>
          <a :href="withBase('/archives/')" class="yh-btn yh-btn-ghost">浏览归档</a>
        </div>
      </div>
      <aside class="yh-sidenote">
        <div class="no">NOTE / 001</div>
        <div class="quote">写作，是把流动的想法按停下来，让它能够被反复阅读。</div>
        <div class="rule"></div>
        <div class="stat">
          <div><b>{{ posts.length }}</b> 篇文章</div>
          <div><b>{{ catCount }}</b> 个分类 · <b>{{ tagCount }}</b> 个标签</div>
          <div>约 <b>{{ words }}</b> 字</div>
        </div>
      </aside>
    </header>

    <!-- 最近文章 -->
    <section class="yh-latest">
      <div class="yh-label"><span>最近文章 / Recent</span><span class="hint">{{ latest.length }} 篇</span></div>
      <ol class="yh-list">
        <li v-for="post in latest" :key="post.url">
          <a :href="post.url" class="yh-list-item">
            <time class="yh-item-date">{{ shortDate(post.date) }}</time>
            <div class="yh-item-body">
              <div class="t">{{ post.title }}</div>
              <div class="s" v-if="summary(post)">{{ summary(post) }}</div>
              <span class="cat" v-else>{{ post.categories[0] || post.tags[0] || '手记' }}</span>
            </div>
            <span class="yh-item-arrow" aria-hidden="true">→</span>
          </a>
        </li>
      </ol>
      <a :href="withBase('/archives/')" class="yh-more">浏览全部归档 <span aria-hidden="true">→</span></a>
    </section>

    <!-- 栏目导航 -->
    <section class="yh-sections">
      <div class="yh-label"><span>栏目 / Columns</span><span class="hint">03</span></div>
      <div class="yh-section-grid">
        <a v-for="sec in sections" :key="sec.k" :href="withBase(sec.link)" class="yh-section-card">
          <span class="k">{{ sec.k }}</span>
          <h3>{{ sec.title }}</h3>
          <p>{{ sec.desc }}</p>
          <span class="c">{{ sec.count() }} 篇 →</span>
        </a>
      </div>
    </section>

    <!-- 技术雷达入口 -->
    <a :href="withBase('/radar/')" class="yh-radar">
      <span class="dot" aria-hidden="true"></span>
      <span class="txt"><b>技术雷达</b> &nbsp;—&nbsp; 来自掘金 · OSCHINA · cnBeta 的 {{ feeds.items.length }} 篇近期好文，已为你聚合</span>
      <span class="go">VIEW →</span>
    </a>

    <!-- 版权页 -->
    <footer class="yh-colophon">
      <span>Dayangui · 前端技术手记</span>
      <span>Set in Serif &amp; Sans · VitePress</span>
      <a href="https://github.com/xudayangui" target="_blank" rel="noopener">GITHUB ↗</a>
    </footer>
  </div>
</template>
