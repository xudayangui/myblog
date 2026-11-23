---
title: RESTful API 设计：那些容易被忽略的细节
date: 2025-01-15
tags:
 - API
 - 后端
 - 架构
categories:
 - 后端
---

REST 这个词人人会说，但真正设计得好的 API 不多。大多数学了个"用 GET 查、POST 增、PUT 改、DELETE 删"就开始写，结果路径命名混乱、状态码乱用、版本管理缺失。这篇讲工程里真正重要的设计规范。

## 资源命名用名词复数

```
GET    /users           # 用户列表
GET    /users/123       # 用户详情
POST   /users           # 创建用户
PUT    /users/123       # 全量更新
PATCH  /users/123       # 部分更新
DELETE /users/123       # 删除
```

常见错误是用动词：`/getUser`、`/createOrder`。HTTP 方法本身已经表达了动作，路径只管资源。

**PUT 和 PATCH 的区别**：

- PUT 是幂等的全量替换，客户端要提供完整资源
- PATCH 只传要改的字段

大部分业务场景用 PATCH 更合理，因为全量更新容易覆盖掉别人改过的字段。

## 状态码要用对

| 场景 | 状态码 |
|------|--------|
| 查询/更新成功 | 200 OK |
| 创建成功 | 201 Created（带 Location 头指向新资源） |
| 删除成功 | 204 No Content |
| 请求参数错误 | 400 Bad Request |
| 未登录 | 401 Unauthorized |
| 已登录但没权限 | 403 Forbidden |
| 资源不存在 | 404 Not Found |
| 资源冲突（如邮箱重复） | 409 Conflict |
| 服务器内部错误 | 500 Internal Server Error |

最常见的误用是：业务失败全返回 200，在 body 里塞 `{ code: 400, message: 'xxx' }`。这种做法让 HTTP 层失去意义，CDN、监控、网关都无法正确识别错误。除非有历史包袱，否则应该用真正的状态码。

## 分页设计

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

两种分页模式：

- **offset 分页**（`?page=2&pageSize=20`）：直观，支持跳页，但深分页时数据库性能差（`LIMIT 100000, 20` 很慢）
- **cursor 分页**（`?cursor=xxx&limit=20`）：性能好，适合信息流，但不能跳页

后台管理用 offset，无限滚动用 cursor。

## 版本管理

三种方式：

1. **URL 版本**：`/api/v1/users` —— 最直观，推荐
2. **Header 版本**：`Accept: application/vnd.api.v1+json`
3. **参数版本**：`?version=1` —— 最不推荐，容易漏

新增字段是向后兼容的，不需要升版本；删除字段、改字段含义、改状态码才需要新版本。

## 错误响应格式统一

```json
{
  "error": {
    "code": "INVALID_EMAIL",
    "message": "邮箱格式不正确",
    "details": [
      { "field": "email", "message": "必须包含 @" }
    ],
    "traceId": "abc-123"
  }
}
```

`traceId` 非常重要——用户报 bug 时给它一个 traceId，你能直接在日志系统里定位到这次请求的完整链路。

## 其他细节

**过滤、排序、字段选择**用查询参数：

```
GET /users?role=admin&sort=-createdAt&fields=id,name,email
```

`-createdAt` 表示倒序，这是 JSON:API 约定。

**批量操作**用 POST + 数组：

```
POST /users/batch  { "users": [...] }
```

**幂等性**：POST 天然不幂等，网络重试可能创建重复数据。解决方案是让客户端带一个 `Idempotency-Key` 请求头，服务端用它去重。

## 小结

好的 API 设计有几个共同点：

1. **一致性**：整个系统的命名、格式、错误处理方式统一
2. **可预测**：看到路径就知道干什么，看到状态码就知道结果
3. **向前兼容**：加字段不破坏老客户端， breaking change 走新版本
4. **可观测**：每个错误都能追踪

REST 不是银弹， GraphQL 和 gRPC 各有适用场景。但只要你在做 HTTP API，这些规范就值得遵守——它们降低的是整个团队的沟通成本。
