---
layout: home

hero:
  name: "喧闹任其喧闹，自有我自为之"
  text: "myBlog · 前端技术手记"
  tagline: JavaScript · Vue · 前端工程实践 — 记录每一个值得沉淀的知识点
  image:
    src: /logo.png
    alt: myBlog
  actions:
    - theme: brand
      text: 开始阅读
      link: /archives/
    - theme: alt
      text: 关于我
      link: https://github.com/xudayangui

features:
  - icon: 🟨
    title: JavaScript
    details: 42 篇语言基础与原理笔记，从 == 与 === 到原型与作用域
    link: /docs/javascript/1
  - icon: 🟩
    title: Vue
    details: Vue 生命周期、Vue CLI 4 等框架实践记录
    link: /docs/vue/Vue
  - icon: 📅
    title: 归档与检索
    details: 按时间、分类、标签多维度回顾所有文章
    link: /archives/
---

## 最近更新

<script setup>
import { data as posts } from './.vitepress/theme/posts.data.js'
</script>

<div class="recent-posts">
  <a v-for="post in posts.slice(0, 8)" :key="post.url" :href="post.url" class="post-item">
    <time>{{ post.date }}</time>
    <span class="title">{{ post.title }}</span>
  </a>
</div>
