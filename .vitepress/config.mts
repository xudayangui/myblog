import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'myBlog',
  description: '喧闹任其喧闹，自有我自为之 — Dayangui 的前端技术博客',
  lang: 'zh-CN',
  base: '/myblog/',
  lastUpdated: true,
  cleanUrls: true,
  head: [
    ['link', { rel: 'icon', href: '/myblog/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#c56473' }],
    ['meta', { name: 'description', content: 'Dayangui 的前端技术博客，记录 JavaScript、Vue 与前端工程实践' }]
  ],
  transformPageData(pageData) {
    // 文章详情页进入阅读模式：关闭右侧大纲，专注长文阅读
    if (pageData.relativePath.startsWith('docs/') && pageData.relativePath.endsWith('.md')) {
      pageData.frontmatter.aside = false
      pageData.frontmatter.sidebar = false
    }
  },
  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'myBlog',
    nav: [
      { text: '首页', link: '/' },
      { text: '归档', link: '/archives' },
      { text: '分类', link: '/categories' },
      { text: '标签', link: '/tags' },
      { text: '技术雷达', link: '/radar' },
      { text: 'GitHub', link: 'https://github.com/xudayangui' }
    ],
    sidebar: [
      { text: 'JavaScript', link: '/docs/javascript/1' },
      { text: 'Vue', link: '/docs/vue/Vue' }
    ],
    outline: { label: '本页目录', level: 'deep' },
    docFooter: { prev: false, next: false },
    lastUpdated: { text: '最后更新于' },
    search: { provider: 'local', options: { translations: { button: { buttonText: '搜索文档' }, modal: { placeholder: '搜索文章...' } } } },
    socialLinks: [{ icon: 'github', link: 'https://github.com/xudayangui' }],
    footer: {
      message: '喧闹任其喧闹，自有我自为之',
      copyright: 'Copyright © 2017–present Dayangui'
    },
    editLink: {
      pattern: 'https://github.com/xudayangui/myblog/edit/master/:path',
      text: '在 GitHub 上编辑此页'
    }
  }
})
