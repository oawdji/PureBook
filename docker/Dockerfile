# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 Prisma 引擎所需的 OpenSSL
RUN apk add --no-cache openssl

# 先只复制依赖文件，忽略 postinstall 脚本（prisma schema 尚未复制）
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# 再复制全部源码（含 prisma schema、app 目录）
COPY . .

# 手动执行 prisma generate（此时 schema 已就位）
RUN npx prisma generate

# 生产构建（跳过静态生成时的 lint/类型检查以加速）
ENV NEXT_PUBLIC_APP_NAME=PureBook
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 安装 Prisma 引擎所需的 OpenSSL
RUN apk add --no-cache openssl

# 只安装生产依赖，忽略 postinstall（.prisma 从 builder 复制）
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# 从 builder 复制生成物（删除了 public 拷贝行）
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["npm", "start"]