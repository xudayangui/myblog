---
title: Pinia 状态管理：从入门到避坑
date: 2025-04-12
tags:
 - Vue
 - Pinia
 - 状态管理
categories:
 - Vue
---

Vuex 退役后，Pinia 成了 Vue 3 的官方状态管理方案。它更轻、类型友好、没有 mutations 的仪式感。但"简单"不代表没有坑，这篇讲实际项目里的用法和边界。

## Store 的两种写法

Pinia 支持 Options 和 Setup 两种风格，官方推荐 Setup：

```ts
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isLogin = computed(() => !!user.value)

  async function login(credentials: Credentials) {
    user.value = await api.login(credentials)
  }

  return { user, isLogin, login }
})
```

对比 Options 写法，Setup 风格的类型推导更好，而且 composable 的逻辑可以无缝搬进来。新项目直接用 Setup。

## 一个关键认知：Store 不是万能缓存

很多人在 store 里塞满服务端数据，然后手动维护 loading / error / 缓存失效——这其实是在重新发明 TanStack Query。

**简单判断**：
- 客户端状态（UI 开关、当前主题、表单草稿）→ Pinia
- 服务端状态（用户列表、文章详情）→ 数据请求库（TanStack Query / SWR）

服务端状态交给专门的工具，你能白嫖到缓存、去重、重试、后台刷新、乐观更新一整套能力。强行用 Pinia 管理，最后一定会写出一堆 `if (this.listFetched && !this.loading)` 的泥潭。

## 常见坑

**1. 解构丢失响应式**

```ts
// 错误：count 失去响应式
const { count } = useCounterStore()

// 正确
const store = useCounterStore()
const count = computed(() => store.count)
// 或
const { count } = storeToRefs(useCounterStore())
```

`storeToRefs` 是 Pinia 提供的工具，它只为 state 和 getters 创建 ref，跳过 action。

**2. 在 store 外修改 state 的时机**

直接改 `store.count++` 是允许的，但复杂业务里建议都走 action，方便追踪和打日志。Pinia 的 devtools 会记录每次 state 变更，但如果逻辑散落在组件里，调试时很难定位来源。

**3. Store 实例的生命周期**

Store 是单例，但它绑定在应用实例上。在 SSR 里如果不用 `pinia` 的 SSR 方案，会出现跨请求状态污染——上一个用户的数据泄漏给下一个用户。Nuxt 里用 `@pinia/nuxt`，手写 SSR 用 `pinia.state.value` 做序列化。

## 持久化

`pinia-plugin-persistedstate` 是最常用的方案：

```ts
defineStore('settings', () => { /* ... */ }, {
  persist: {
    paths: ['theme', 'locale'],  // 只持久化这两个字段
    storage: localStorage
  }
})
```

注意**不要持久化敏感信息**（token 最好放 httpOnly Cookie），也不要把整个 store 都持久化——数据结构变化时旧缓存会导致诡异的 bug。用 `version` 字段配合 `migrate` 处理版本迁移。

## 测试

Pinia 的 store 测试非常干净，因为它不依赖组件：

```ts
beforeEach(() => {
  setActivePinia(createPinia())
})

it('登录成功后 isLogin 为 true', async () => {
  const store = useUserStore()
  await store.login({ name: 'test', password: '123' })
  expect(store.isLogin).toBe(true)
})
```

`setActivePinia` 在每个测试前重置，避免测试间状态污染。

## 小结

Pinia 的核心优势是"去掉仪式感"。但越简单越考验边界意识：分清客户端状态和服务端状态、正确解构、控制持久化范围，这三点做到了，状态管理就不会成为项目的负担。
