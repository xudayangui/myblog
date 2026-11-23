---
title: 标签
description: 按标签浏览全部文章
sidebar: false
---

<script setup>
import { computed } from 'vue'
import { data as posts } from './.vitepress/theme/posts.data.js'

const groups = computed(() => {
  const map = new Map()
  for (const post of posts) {
    for (const tag of post.tags) {
      if (!map.has(tag)) map.set(tag, [])
      map.get(tag).push(post)
    }
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
})
</script>

# 标签

<div v-for="[tag, list] in groups" :key="tag" style="margin-bottom: 32px">
  <div class="archive-year">{{ tag }} <span style="font-size:14px;color:var(--vp-c-text-2)">· {{ list.length }} 篇</span></div>
  <a v-for="post in list" :key="post.url" :href="post.url" class="post-item">
    <time>{{ post.date }}</time>
    <span class="title">{{ post.title }}</span>
  </a>
</div>
