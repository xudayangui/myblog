---
title: 手写一个符合 Promise A+ 的 Promise
date: 2024-01-20
tags:
 - JavaScript
 - Promise
 - 手写实现
categories:
 - JavaScript
---

Promise 是异步编程的核心。手写一遍能帮你真正理解它的状态流转、链式调用和值穿透。这篇文章从零实现一个相对完整的 Promise。

## Promise 的核心结构

一个 Promise 有三个状态：`pending`、`fulfilled`、`rejected`。状态一旦改变就不可逆。

```javascript
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class MyPromise {
  constructor(executor) {
    this.status = PENDING
    this.value = undefined
    this.reason = undefined
    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []

    const resolve = (value) => {
      if (this.status === PENDING) {
        this.status = FULFILLED
        this.value = value
        this.onFulfilledCallbacks.forEach(fn => fn())
      }
    }

    const reject = (reason) => {
      if (this.status === PENDING) {
        this.status = REJECTED
        this.reason = reason
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }

    try {
      executor(resolve, reject)
    } catch (err) {
      reject(err)
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
    onRejected = typeof onRejected === 'function' ? onRejected : e => { throw e }

    const promise2 = new MyPromise((resolve, reject) => {
      const handleFulfilled = () => {
        queueMicrotask(() => {
          try {
            const x = onFulfilled(this.value)
            resolvePromise(promise2, x, resolve, reject)
          } catch (err) { reject(err) }
        })
      }
      const handleRejected = () => {
        queueMicrotask(() => {
          try {
            const x = onRejected(this.reason)
            resolvePromise(promise2, x, resolve, reject)
          } catch (err) { reject(err) }
        })
      }

      if (this.status === FULFILLED) handleFulfilled()
      else if (this.status === REJECTED) handleRejected()
      else {
        this.onFulfilledCallbacks.push(handleFulfilled)
        this.onRejectedCallbacks.push(handleRejected)
      }
    })
    return promise2
  }
}
```

## resolvePromise：处理链式返回值

这是 A+ 规范里最绕的部分，负责处理 `then` 返回值可能是普通值、Promise 或 thenable 的情况：

```javascript
function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected'))
  }
  if (x instanceof MyPromise) {
    return x.then(resolve, reject)
  }
  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    let called = false
    try {
      const then = x.then
      if (typeof then === 'function') {
        then.call(x, y => {
          if (called) return
          called = true
          resolvePromise(promise2, y, resolve, reject)
        }, e => {
          if (called) return
          called = true
          reject(e)
        })
      } else {
        resolve(x)
      }
    } catch (err) {
      if (called) return
      reject(err)
    }
  } else {
    resolve(x)
  }
}
```

## 补齐静态方法

```javascript
MyPromise.resolve = function (value) {
  if (value instanceof MyPromise) return value
  return new MyPromise(resolve => resolve(value))
}

MyPromise.reject = function (reason) {
  return new MyPromise((_, reject) => reject(reason))
}

MyPromise.all = function (promises) {
  return new MyPromise((resolve, reject) => {
    const result = []
    let count = 0
    promises.forEach((p, i) => {
      MyPromise.resolve(p).then(v => {
        result[i] = v
        if (++count === promises.length) resolve(result)
      }, reject)
    })
  })
}

MyPromise.race = function (promises) {
  return new MyPromise((resolve, reject) => {
    promises.forEach(p => MyPromise.resolve(p).then(resolve, reject))
  })
}
```

## 验证

用官方的 `promises-aplus-tests` 可以跑完整的 A+ 用例。手写 Promise 的意义不在于造轮子，而在于理解状态机、微任务调度和链式调用的传递规则——这些才是面试真正考察的东西。
