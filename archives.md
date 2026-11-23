---
title: 归档
description: 按时间回顾全部文章
sidebar: false
---

<script setup>
import { computed } from 'vue'
import { data as posts } from './.vitepress/theme/posts.data.js'

const groups = computed(() => {
  const map = new Map()
  for (const post of posts) {
    const year = post.date.slice(0, 4)
    if (!map.has(year)) map.set(year, [])
    map.get(year).push(post)
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0])
})
</script>

# 归档

共 **{{ posts.length }}** 篇文章。

<div v-for="[year, list] in groups" :key="year">
  <div class="archive-year">{{ year }} <span class="count">· {{ list.length }} 篇</span></div>
  <a v-for="post in list" :key="post.url" :href="post.url" class="post-item">
    <time>{{ post.date.slice(5) }}</time>
    <span class="title">{{ post.title }}</span>
    <span class="arrow" aria-hidden="true">→</span>
  </a>
</div>
