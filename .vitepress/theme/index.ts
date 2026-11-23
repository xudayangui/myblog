import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp() {
    // 依赖默认主题的 LocalSearch，无需额外注册
  }
} satisfies Theme
