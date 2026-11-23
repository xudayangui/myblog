---
title: 现代 CSS 布局：从 Flexbox 到 Grid 的实战抉择
date: 2025-06-18
tags:
 - CSS
 - 布局
 - 前端
categories:
 - CSS
---

Flexbox 和 Grid 都能做布局，但很多人在项目里凭习惯乱用，结果写出一堆 `margin: auto` 和 `calc(100% - 240px)` 的补丁。这篇文章不讲语法，只讲**什么时候该用谁**，以及几个真实业务场景的解法。

## 一句话区分

- **Flexbox**：一维布局，适合"一行"或"一列"的内容排布——导航栏、按钮组、卡片内部。
- **Grid**：二维布局，同时控制行和列——页面骨架、仪表盘、图片墙。

判断标准很简单：如果你需要同时约束横向和纵向的对齐关系，用 Grid；否则用 Flexbox。

## 场景一：经典后台骨架

左侧固定侧边栏 + 右侧自适应内容，这是 Grid 的主场：

```css
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 64px 1fr;
  min-height: 100vh;
}
.header { grid-column: 1 / -1; }
.sidebar { grid-row: 2; }
```

不用算宽度、不用绝对定位，侧边栏宽度改一个数就行。如果用 Flexbox，你需要给 content 设 `flex: 1` 还要处理 `min-width: 0` 防止内容撑破——能做，但绕。

## 场景二：响应式卡片墙

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
```

`auto-fill` + `minmax` 是 CSS 里最优雅的响应式写法之一：容器宽就多排几列，窄就少排，**一行代码搞定**断点，不需要写任何媒体查询。

`auto-fill` 和 `auto-fit` 的区别常被搞混：`auto-fill` 会保留空轨道，`auto-fit` 会折叠空轨道让已有项拉伸填满。卡片数量不足时想要居中展示用 `auto-fill`，想要撑满用 `auto-fit`。

## 场景三：居中这件事

Flexbox 两行搞定：

```css
.center { display: flex; align-items: center; justify-content: center; }
```

Grid 一行：

```css
.center { display: grid; place-items: center; }
```

现代浏览器里 `place-items` 已经完全可用，没有兼容性顾虑的话优先用它。

## 容易踩的坑

**Flex 子项不收缩**：`flex: 1` 的子项里如果有长文本或表格，会把父容器撑破。原因是 flex item 的 `min-width` 默认是 `auto`（内容宽度）。解法：

```css
.flex-child { flex: 1; min-width: 0; }
```

**Grid 的隐式轨道**：往 Grid 容器里塞超出定义数量的元素，会自动生成隐式行，尺寸由 `grid-auto-rows` 控制。如果不设，高度可能不符合预期。

**`gap` 在旧版 Safari**：Flexbox 的 `gap` 直到 Safari 14.1 才支持。如果需要兼容更老版本，只能用 margin 补丁。2026 年的今天基本可以不用管了。

## 容器查询：布局的下一次进化

媒体查询看的是视口宽度，但一个组件在侧边栏里和在主体区里，明明宽度不同却只能响应同一个断点。容器查询解决了这个问题：

```css
.card-container { container-type: inline-size; }

@container (min-width: 400px) {
  .card { display: grid; grid-template-columns: 120px 1fr; }
}
```

组件根据自己的容器宽度调整布局，真正实现了"组件级响应式"。现在主流浏览器已全面支持，是时候在项目里用起来了。

## 选型速查

| 需求 | 推荐 |
|------|------|
| 导航、按钮组、单行列表 | Flexbox |
| 页面整体骨架、仪表盘 | Grid |
| 卡片墙、图片网格 | Grid + auto-fill |
| 垂直居中 | Grid place-items |
| 等宽多列 | Grid repeat |
| 内容未知的一维排列 | Flexbox |

布局没有银弹，但把"一维用 Flex，二维用 Grid"这条原则刻进肌肉记忆，能避开 80% 的布局难题。剩下的 20%，通常是 `min-width: 0`。
