import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import type { Theme } from 'vitepress'
import HomePage from './components/HomePage.vue'
import ArticleHeader from './components/ArticleHeader.vue'
import ArticleFooter from './components/ArticleFooter.vue'
import TechRadar from './components/TechRadar.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
    app.component('TechRadar', TechRadar)
  },
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(ArticleHeader),
      'doc-after': () => h(ArticleFooter)
    })
  }
} satisfies Theme
