---
title: React Hooks 常见陷阱与最佳实践
date: 2024-02-18
tags:
 - React
 - Hooks
 - 前端框架
categories:
 - React
---

Hooks 让函数组件拥有了状态和副作用能力，但闭包陷阱、依赖数组、无限渲染这些问题也让不少人踩坑。这篇文章梳理几个最常见的坑和正确写法。

## 陷阱一：闭包陷阱

这是最经典的问题：

```javascript
function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count + 1)  // 永远只加到 1
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return <div>{count}</div>
}
```

`useEffect` 的回调捕获了初始渲染时的 `count`（值为 0），且依赖数组为空不再更新。修复方式是用函数式更新：

```javascript
setCount(c => c + 1)  // 拿到最新的 count
```

## 陷阱二：依赖数组不完整

```javascript
useEffect(() => {
  fetchData(userId)
}, [])  // 漏了 userId
```

用 ESLint 的 `react-hooks/exhaustive-deps` 规则能自动检查。如果确实只想执行一次又用到了外部变量，用 ref 保存：

```javascript
const userIdRef = useRef(userId)
useEffect(() => { fetchData(userIdRef.current) }, [])
```

## 陷阱三：useEffect 中的对象依赖导致无限循环

```javascript
useEffect(() => {
  setData({ list: [] })
}, [])  // 如果依赖里放了每次新建的对象，就会无限触发
```

对象和数组作为依赖时比较的是引用。要么用 `useMemo` 稳定引用，要么依赖具体的基础类型值。

## 实践：用自定义 Hook 封装逻辑

和 Vue 的 composable 类似，React 用自定义 Hook 复用逻辑：

```javascript
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}
```

## useCallback 和 useMemo 别滥用

很多人无条件给所有函数加 `useCallback`，其实这本身也有开销。只在以下场景使用：

- 函数作为 props 传给被 `React.memo` 包裹的子组件
- 函数作为其他 Hook 的依赖
- 计算开销确实很大的值用 `useMemo`

## 小结

Hooks 的核心心智模型是「**每次渲染都是独立的快照**」。理解了闭包捕获和依赖比较这两个本质，大多数问题都能迎刃而解。
