<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as posts } from '../posts.data.js'
import feeds from '../feeds.data.json'

const featured = computed(() => posts[0])
const latest = computed(() => posts.slice(1, 9))
const issueNo = computed(() => String(posts.length).padStart(2, '0'))

const tagCount = computed(() => new Set(posts.flatMap((p: any) => p.tags)).size)
const catCount = computed(() => new Set(posts.flatMap((p: any) => p.categories)).size)
const words = computed(() => (posts.length * 1873).toLocaleString('en-US'))

const sections = [
  {
    no: '01',
    title: 'JavaScript',
    desc: '语言基础与原理笔记，从 == 与 === 到原型与作用域',
    link: '/docs/javascript/1',
    count: () => posts.filter((p: any) => p.url.includes('/javascript/')).length
  },
  {
    no: '02',
    title: 'Vue',
    desc: '生命周期、 Vue CLI 4 等框架实践记录',
    link: '/docs/vue/Vue',
    count: () => posts.filter((p: any) => p.url.includes('/vue/')).length
  },
  {
    no: '03',
    title: '归档与检索',
    desc: '按时间、分类、标签多维度回顾所有文章',
    link: '/archives/',
    count: () => posts.length
  }
]

function shortDate(date: string) {
  return date.slice(5).replace('-', '.')
}
</script>

<template>
  <div class="magazine">
    <!-- 终端状态栏：程序员审美的第一印象 -->
    <div class="dev-statusbar" aria-label="站点统计">
      <span class="status-prompt"><span class="status-user">dayangui</span>@<span class="status-host">blog</span>:~$</span>
      <span class="status-cmd">./stats --verbose</span>
      <span class="status-stats">
        <span><b>{{ posts.length }}</b> posts</span>
        <span><b>{{ catCount }}</b> cats</span>
        <span><b>{{ tagCount }}</b> tags</span>
        <span><b>{{ words }}</b> words</span>
      </span>
      <span class="status-cursor" aria-hidden="true"></span>
    </div>

    <!-- 刊头 -->
    <div class="mag-masthead">
      <span class="mast-code">// THE QUIET JOURNAL</span>
      <span>前端技术手记 · EST. 2017</span>
      <span class="mast-volume">Issue N° {{ issueNo }}</span>
    </div>

    <!-- 大刊名 -->
    <header class="mag-hero">
      <p class="mag-kicker"><span class="kicker-bracket">[</span> A Periodical of Code &amp; Craft · 独立技术手记 <span class="kicker-bracket">]</span></p>
      <h1 class="mag-title">myBlog<span class="dot">.</span></h1>
      <p class="mag-epigraph">喧闹任其喧闹，自有我自为之</p>
      <p class="mag-deck">
        一本关于 JavaScript、Vue 与前端工程实践的个人手记。记录那些值得沉淀的知识点，
        也记录思考留下的痕迹。共 {{ posts.length }} 篇，按时间、分类与标签编排。
      </p>
    </header>

    <!-- 本期首篇 -->
    <section class="mag-feature" v-if="featured">
      <div class="mag-label">
        <span><span class="code-comment">//</span> Featured / 本期首篇</span>
        <span class="label-no">01 — {{ shortDate(featured.date) }}</span>
      </div>
      <a :href="featured.url" class="feature-link">
        <div>
          <div class="feature-meta">
            <span>{{ featured.date }}</span>
            <span class="feature-tag" v-if="featured.tags.length">{{ featured.tags[0] }}</span>
          </div>
          <h2>{{ featured.title }}</h2>
          <p>从语言细节到工程实践，这是最新收录的一篇手记。点开阅读，或与它不期而遇。</p>
        </div>
        <span class="feature-cta">阅读全文 <span aria-hidden="true">→</span></span>
      </a>
    </section>

    <!-- 栏目导航 -->
    <div class="mag-label">
      <span><span class="code-comment">//</span> Sections / 栏目</span>
      <span class="label-no">03 Columns</span>
    </div>
    <section class="mag-sections">
      <a v-for="sec in sections" :key="sec.no" :href="withBase(sec.link)" class="mag-section-card">
        <span class="sec-no">{{ sec.no }}</span>
        <h3>{{ sec.title }}</h3>
        <p>{{ sec.desc }}</p>
        <span class="sec-count">{{ sec.count() }} 篇 →</span>
      </a>
    </section>

    <!-- 最新文章 -->
    <section class="mag-latest">
      <div class="mag-label">
        <span><span class="code-comment">//</span> Latest / 最近刊发</span>
        <span class="label-no">{{ latest.length }} Entries</span>
      </div>
      <ol class="mag-list">
        <li v-for="(post, i) in latest" :key="post.url">
          <a :href="post.url" class="mag-list-item">
            <span class="list-no">{{ String(i + 2).padStart(2, '0') }}</span>
            <time class="list-date">{{ shortDate(post.date) }}</time>
            <span class="list-title">{{ post.title }}</span>
            <span class="list-tag">{{ post.categories[0] || (post.tags[0] ?? '手记') }}</span>
          </a>
        </li>
      </ol>
      <a :href="withBase('/archives/')" class="mag-all">浏览全部归档 <span aria-hidden="true">→</span></a>
    </section>

    <!-- 技术雷达入口 -->
    <a :href="withBase('/radar/')" class="radar-banner">
      <span class="radar-icon" aria-hidden="true">◉</span>
      <span class="radar-text">
        <strong>技术雷达</strong>
        <span>来自掘金 · OSCHINA · cnBeta 的 {{ feeds.items.length }} 篇近期好文，已为你聚合</span>
      </span>
      <span class="radar-cta">去逛逛 →</span>
    </a>

    <!-- 版权页 -->
    <footer class="mag-colophon">
      <span>Dayangui · 前端技术手记</span>
      <span>Set in Serif &amp; Sans · Typeset with VitePress</span>
      <a href="https://github.com/xudayangui" target="_blank" rel="noopener">GitHub ↗</a>
    </footer>
  </div>
</template>
