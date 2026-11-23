---
title: Vue3 组合式 API 的五个实践心得
date: 2024-02-10
tags:
 - Vue
 - Vue3
 - 组合式API
categories:
 - Vue
---

从 Options API 迁移到组合式 API（Composition API）一段时间后，我总结了五个真正提升开发体验的实践。不是语法翻译，而是思维方式的转变。

## 1. 用 composable 抽取逻辑，而不是按选项分组

Options API 按 `data`、`methods`、`computed` 分组，一个功能点的代码散落在各处。组合式 API 的核心价值是**按逻辑关注点组织代码**：

```javascript
// useMouse.js — 把鼠标追踪逻辑封装成可复用的 composable
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(e) {
    x.value = e.pageX
    y.value = e.pageY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}
```

在组件里直接用：

```javascript
const { x, y } = useMouse()
```

## 2. ref 还是 reactive？一条简单规则

很多人纠结用哪个。我的规则是：

- **基本类型用 `ref`**
- **对象用 `reactive`**，但如果要整体替换，用 `ref`

```javascript
const count = ref(0)          // 基本类型
const user = reactive({ name: 'Tom' })  // 对象
const list = ref([])          // 会被整体替换的数组
```

`reactive` 的解构会丢失响应性，需要 `toRefs`：

```javascript
const state = reactive({ x: 1, y: 2 })
const { x, y } = toRefs(state)  // 保持响应
```

## 3. 用 watchEffect 处理联动副作用

当副作用依赖多个响应式数据，且不需要区分新旧值时，`watchEffect` 更简洁：

```javascript
const userId = ref(1)
const user = ref(null)

watchEffect(async () => {
  user.value = await fetchUser(userId.value)
})
```

它会自动追踪依赖，`userId` 变化时重新执行。需要监听具体来源、拿新旧值、或控制触发时机时用 `watch`。

## 4. 副作用一定要在 onUnmounted 清理

定时器、事件监听、订阅——这些忘记清理就是内存泄漏。组合式 API 里养成习惯：

```javascript
export function useTimer() {
  const now = ref(Date.now())
  const timer = setInterval(() => now.value = Date.now(), 1000)
  onUnmounted(() => clearInterval(timer))
  return { now }
}
```

## 5. 用 provide/inject 做跨层级状态共享

对于中等规模的状态（比如主题、用户信息），不必引入 Pinia，用 `provide/inject` 就够了：

```javascript
// 祖先组件
const theme = ref('light')
provide('theme', theme)

// 深层子组件
const theme = inject('theme')
```

配合 readonly 可以防止被子组件误改：

```javascript
provide('theme', readonly(theme))
```

## 小结

组合式 API 不是把 Options API 换了个写法，而是让你能**按功能把相关的响应式状态、计算逻辑和副作用聚在一起**。写多了会发现，代码的可读性和可复用性都有质的提升。
