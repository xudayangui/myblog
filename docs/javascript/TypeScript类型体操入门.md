---
title: TypeScript 类型体操入门
date: 2024-04-20
tags:
 - TypeScript
 - 类型系统
categories:
 - JavaScript
---

TypeScript 的类型系统本身是一门图灵完备的语言，所谓「类型体操」就是用类型做计算。看似炫技，但理解它能帮你写出更精确的类型定义。

## 从基础工具类型开始

TypeScript 内置了很多工具类型，它们是类型体操的基础：

```typescript
type A = Partial<User>      // 所有属性变可选
type B = Required<User>     // 所有属性变必填
type C = Pick<User, 'name'> // 挑选属性
type Omit<User, 'age'>      // 排除属性
type R = Readonly<User>     // 只读
```

## 条件类型

条件类型是类型体操的核心，类似三元表达式：

```typescript
type IsString<T> = T extends string ? true : false

type A = IsString<'hello'>  // true
type B = IsString<123>      // false
```

## infer：提取类型

`infer` 可以在条件类型中声明一个待推断的类型变量：

```typescript
// 提取函数返回值类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never

type A = ReturnType<() => string>  // string

// 提取数组元素类型
type ElementType<T> = T extends (infer U)[] ? U : never
type B = ElementType<string[]>  // string
```

## 递归类型

类型也可以递归。比如实现一个深度只读：

```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K]
}
```

## 模板字面量类型

TS 4.1 引入的模板字面量类型能构造字符串类型：

```typescript
type EventName<T extends string> = `on${Capitalize<T>}`

type ClickEvent = EventName<'click'>  // 'onClick'
```

## 一个实用例子：实现 MyAwaited

递归解开嵌套的 Promise：

```typescript
type MyAwaited<T> = T extends Promise<infer U>
  ? U extends Promise<any>
    ? MyAwaited<U>
    : U
  : T

type A = MyAwaited<Promise<string>>           // string
type B = MyAwaited<Promise<Promise<number>>>  // number
```

## 什么时候该用

类型体操不是日常必需。业务代码里，简单直接的类型往往更好维护。它真正的价值在于：

- 编写通用库时提供精确的类型推导
- 从已有数据结构衍生出需要的类型，避免重复定义
- 用类型约束防止错误用法

掌握到能读懂工具类型源码、能写简单的条件类型和 infer 就够了，不必追求把类型系统当编程语言写算法。
