---
title: 彻底搞懂 HTTP 缓存：强缓存与协商缓存
date: 2025-03-28
tags:
 - HTTP
 - 缓存
 - 后端
categories:
 - 后端
---

HTTP 缓存是性能优化里性价比最高的一环，但也是最容易配错的——缓存没生效、缓存太久导致更新不及时、用户看到旧版本，这些问题的根源都是没理清两种缓存的区别。

## 两张表的分工

浏览器请求资源时，先看**强缓存**，命中就直接用，不发请求；没命中才发请求问服务器要不要更新，这就是**协商缓存**。

**强缓存**相关响应头：

| 头 | 含义 | 优先级 |
|----|------|--------|
| `Cache-Control: max-age=3600` | 相对时间，3600 秒内有效 | 高 |
| `Expires: Wed, 21 Oct 2026 07:28:00 GMT` | 绝对时间 | 低（受本地时钟影响） |

现在基本只用 `Cache-Control`。常见指令：

- `no-store`：完全不缓存（敏感数据）
- `no-cache`：可以存，但每次都要问服务器（名字反直觉）
- `public` / `private`：是否允许 CDN 等共享缓存
- `max-age`：缓存有效期
- `immutable`：资源永不变（带 hash 的静态资源）

**协商缓存**相关响应头：

| 头 | 配合请求头 | 说明 |
|----|-----------|------|
| `Last-Modified` | `If-Modified-Since` | 按修改时间判断，精度到秒 |
| `ETag` | `If-None-Match` | 按内容哈希判断，更精确 |

服务器比对后，没变化返回 `304 Not Modified`（无响应体），变了返回 `200` + 新内容。ETag 优先于 Last-Modified，因为它能解决"1 秒内多次修改"和"内容没变但 mtime 变了"的问题。

## 最佳实践：按资源类型分策略

**带 hash 的静态资源**（`app.a3f9c.js`）：

```
Cache-Control: public, max-age=31536000, immutable
```

内容变了 hash 就变，URL 也变了，所以可以放心缓存一年。这是现代前端构建工具的标配。

**HTML 入口文件**：

```
Cache-Control: no-cache
```

HTML 里引用了带 hash 的资源，它必须每次都去服务器确认是否是最新版本，否则用户会拿到引用旧资源的 HTML。

**API 响应**：

按业务定。用户隐私数据用 `private, no-store`；公开且变化不频繁的数据（文章列表、配置）可以用 `public, max-age=60` 或配 ETag。

## 一个真实故障

有次上线后用户反馈"样式还是旧的"，排查发现：运维给所有资源统一配了 `max-age=86400`，包括 HTML。结果用户一天内访问都是从缓存拿的旧 HTML，引用的还是旧 CSS hash。

修复就是上面那套分层策略：**HTML 用 no-cache，静态资源长缓存**。这是webpack/vite 项目的标准答案。

## Service Worker 里的缓存

SW 又多了一层，缓存优先级更高。注意 SW 的缓存和 HTTP 缓存是两套体系，`cache.add()` 发请求时依然会走 HTTP 缓存策略。调试 SW 缓存问题时要同时看 Application → Cache Storage 和 Network 面板的 `from ServiceWorker` 标记。

## 调试技巧

Chrome DevTools 的 Network 面板：
- **Size** 列显示 `(memory cache)` / `(disk cache)` = 强缓存命中
- 状态码 `304` = 协商缓存命中
- 勾选 **Disable cache** 可以绕过缓存调试

用 `curl -I <url>` 看响应头，快速确认服务器配置：

```bash
curl -I https://example.com/app.js
# 关注 cache-control / etag / last-modified
```

## 小结

记住这张决策树：

1. 文件名带 hash？→ 强缓存一年 + immutable
2. 是 HTML 入口？→ no-cache
3. 是 API？→ 按敏感度选 no-store / private / max-age
4. 内容可能变但 URL 不变？→ 配 ETag 走协商缓存

缓存的本质是"用空间换时间"，配对了皆大欢喜，配错了就是幽灵 bug 之王。
