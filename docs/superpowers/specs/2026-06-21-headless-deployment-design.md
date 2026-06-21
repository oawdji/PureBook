# 无域名/无 SSL 证书场景部署方案

**日期**: 2026-06-21  
**状态**: 已批准

## 背景

用户购买了云服务器但没有域名和 SSL 证书，需要通过服务器公网 IP 直接访问 PureBook。当前 Docker 部署配置依赖 SSL 证书（`docker/certs/`），无法直接运行。

## 约束

- 无域名，通过 IP 访问
- 无 CA 签发的 SSL 证书
- 云服务器走公网，需要传输加密
- 用户可接受浏览器自签名证书警告

## 方案：自签名证书 + 环境变量分离

### 改动点

| 文件 | 操作 | 说明 |
|------|------|------|
| `scripts/generate-certs.sh` | 新增 | 一键生成 10 年有效期的自签名证书 |
| `.env.production` | 新增 | Docker 容器内使用的环境变量（服务名而非 localhost） |
| `docker-compose.yml` | 修改 | 改用 `env_file: .env.production`，确保数据库/Redis 连接正确 |
| `.gitignore` | 修改 | 忽略 `docker/certs/` 和 `.env.production` |

### 证书生成脚本

```bash
#!/bin/bash
# 生成自签名 SSL 证书（有效期 10 年）
mkdir -p docker/certs
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout docker/certs/server.key \
  -out docker/certs/server.crt \
  -subj "/CN=localhost"
```

### 环境变量对比

| 变量 | 本地开发 (.env) | Docker 生产 (.env.production) |
|------|-----------------|-------------------------------|
| DATABASE_URL | `localhost:5433` | `postgres:5432` |
| REDIS_URL | `localhost:6380` | `redis:6379` |

### 部署流程

1. 将代码上传到服务器
2. 运行 `bash scripts/generate-certs.sh` 生成证书
3. 复制 `.env.production.example` 为 `.env.production`，修改 `JWT_SECRET`
4. 运行 `docker compose up -d --build`
5. 浏览器访问 `https://<服务器IP>`，忽略证书警告后正常使用

### 不变

- Nginx 配置不变（仍监听 443 + HTTP→HTTPS 重定向）
- 应用代码不变
- Cookie Secure 标志不变
- 本地开发流程不变（`.env` 和 npm run dev 照旧）
