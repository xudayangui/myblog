# myBlog

Dayangui 的前端技术博客，线上地址：<https://xudayangui.github.io/myblog/>

记录 JavaScript、Vue 与前端工程实践中的知识点与心得。

## 技术栈

- **VitePress 1.x**（Vue 3 + Vite）— 由 VuePress 1 + reco 主题迁移而来
- Markdown 写作，frontmatter 里声明 `title` / `date` / `tags` / `categories`
- 构建时通过 `createContentLoader` 自动生成归档、分类、标签页
- GitHub Actions 自动构建并部署到 GitHub Pages

## 本地开发

需要 Node.js 18+（推荐 20 或 22）。

```bash
npm install
npm run dev        # 本地预览，默认 http://localhost:5173/myblog/
npm run build      # 构建到 .vitepress/dist
npm run preview    # 预览构建产物
```

## 写文章

1. 在 `docs/javascript/` 或 `docs/vue/` 下新建 `.md` 文件（按分类放目录）。
2. 文件开头写 frontmatter：

```yaml
---
title: 文章标题
date: 2022-03-29
tags:
  - JavaScript
categories:
  - 前端
---
```

3. 归档 / 分类 / 标签页会在构建时自动收录，无需手动维护列表。

## 技术雷达

`/radar/` 是从掘金、OSCHINA、cnBeta 等公开 RSS 聚合的技术文章页，只展示标题与摘要并跳转原文，尊重原作者版权。

```bash
npm run fetch:feeds   # 手动抓取最新文章
npm run build:full    # 抓取 + 构建
```

GitHub Actions 会在每次部署前自动抓取，并每天北京时间 09:00 定时更新。抓取失败的源会自动跳过并保留上次缓存（`feeds.data.json`）。

## 发布

推送到 `master` 分支后，GitHub Actions（`.github/workflows/deploy.yml`）会自动抓取文章、构建并部署。
需在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。

## 目录结构

```
.
├── index.md              # 首页（杂志风 + 程序员审美）
├── archives.md           # 归档页
├── categories.md         # 分类页
├── tags.md               # 标签页
├── radar.md              # 技术雷达（聚合外部好文）
├── docs/                 # 全部文章（44 篇）
│   ├── javascript/
│   └── vue/
├── scripts/
│   └── fetch-feeds.mjs   # 技术文章抓取脚本
└── .vitepress/
    ├── config.mts        # 站点配置
    └── theme/
        ├── index.ts      # 主题入口
        ├── style.css     # "THE QUIET JOURNAL" 设计系统
        ├── posts.data.js # 本站文章数据加载器
        ├── feeds.data.json # 聚合文章缓存（自动生成）
        └── components/   # HomePage / ArticleHeader / TechRadar
```
