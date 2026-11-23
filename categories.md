---
title: 分类
description: 按分类浏览全部文章
sidebar: false
---

<script setup>
import { computed } from 'vue'
import { data as posts } from './.vitepress/theme/posts.data.js'

const groups = computed(() => {
  const map = new Map()
  for (const post of posts) {
    for (const cat of post.categories.length ? post.categories : ['未分类']) {
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat).push(post)
    }
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
})
</script>

# 分类

<div v-for="[cat, list] in groups" :key="cat">
  <div class="archive-year">{{ cat }} <span style="font-size:14px;color:var(--vp-c-text-2)">· {{ list.length }} 篇</span></div>
  <a v-for="post in list" :key="post.url" :href="post.url" class="post-item">
    <time>{{ post.date }}</time>
    <span class="title">{{ post.title }}</span>
  </a>
</div>
