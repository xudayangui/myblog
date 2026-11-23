---
title: Docker 前端开发者实用入门
date: 2024-08-22
tags:
 - Docker
 - 开发工具
 - 部署
categories:
 - 开发工具
---

Docker 不是运维专属。前端开发者掌握 basics，能解决「在我机器上能跑」的环境一致性问题，也能轻松搭起各种服务。

## 三个核心概念

- **Image（镜像）**：只读的模板，相当于类
- **Container（容器）**：镜像的运行实例，相当于对象
- **Dockerfile**：构建镜像的脚本

## 常用命令速查

```bash
# 运行容器
docker run -d -p 3000:80 --name my-nginx nginx

# 查看运行中的容器
docker ps

# 进入容器
docker exec -it my-nginx sh

# 停止并删除
docker stop my-nginx && docker rm my-nginx

# 查看日志
docker logs -f my-nginx
```

## 为前端项目写 Dockerfile

一个典型的静态站点部署（多阶段构建）：

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段：只保留构建产物，镜像更小
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

构建和运行：

```bash
docker build -t my-blog .
docker run -d -p 8080:80 my-blog
```

## Docker Compose 管理多服务

本地开发经常需要同时跑应用 + 数据库 + Redis，用 `docker-compose.yml` 一次拉起：

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - redis
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

```bash
docker compose up -d
```

macOS 上推荐用 **OrbStack** 替代 Docker Desktop，启动快、资源占用低。

## 常见问题

**容器内访问宿主机服务**：用 `host.docker.internal`（Mac/Windows）而不是 `localhost`。

**数据持久化**：用 volume 挂载，否则容器删除数据就没了：

```bash
docker run -v /host/path:/container/path ...
```

**镜像太大**：用 alpine 基础镜像、多阶段构建、`.dockerignore` 排除 node_modules。

## 小结

前端学 Docker 不用深入底层，掌握「运行现成镜像 + 给自己的项目写 Dockerfile + Compose 编排」这三板斧，就够应付绝大多数日常场景了。
