# PureBook — 个人记账应用

简单优雅的个人 Web 记账应用，以丰富的图表和动画交互呈现财务数据，从零设计到 Docker 部署完整闭环。

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-6-0170FE?logo=antdesign)](https://ant.design/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docs.docker.com/compose/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## ✨ 功能特性

- **📊 仪表盘** — 本月收入 / 支出 / 结余统计卡片，数字滚动动效，近 6 月趋势迷你折线图，卡片 stagger 依次入场
- **💰 收支记录** — 完整 CRUD，多条件组合筛选（分类 / 账户 / 日期范围 / 金额范围 / 关键字），分页加载，CSV 导出
- **🏷️ 分类管理** — 10 个系统预设分类（餐饮、交通、购物、住房、娱乐、医疗、工资、通讯、教育、其他），支持自定义分类，删除时自动迁移关联记录
- **🏦 账户管理** — 多账户支持（现金 / 银行卡 / 信用卡 / 支付软件），余额实时同步，账户间转账（数据库事务保证一致性）
- **📈 统计分析** — 月度分类占比饼图（点击钻取明细） + 近 6 月收支对比柱状图，图表生长动画
- **🔐 安全认证** — 注册 / 登录，JWT + HttpOnly Secure Cookie，bcrypt 密码加密，API 层全局鉴权中间件，未登录自动跳转
- **🎨 动画交互** — framer-motion 四层级动画体系：路由淡入淡出 / 组件 stagger 入场 / 抽屉滑入滑出 / 数字滚动；hover 微交互反馈
- **📱 响应式布局** — Ant Design Layout 骨架，侧边栏可折叠，桌面端优先但适配平板
- **🐳 容器化部署** — Docker Compose 四服务编排（Nginx + Next.js + PostgreSQL + Redis），多阶段 Dockerfile，自签名证书支持无域名服务器部署

## 🛠 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | React + Next.js (App Router) | 18 / 14 | 全栈一体化，Server Components + API Routes |
| 开发语言 | TypeScript | 5 | 全栈类型安全，Prisma → API → 前端类型链路完整 |
| CSS 方案 | Tailwind CSS + Ant Design | 3 / 6 | 原子化 CSS 自定义细节 + 企业级组件库 |
| 图表 | Recharts | 3 | React 原生声明式图表，支持动画过渡 |
| 动画 | framer-motion + @react-spring/web | 12 / 10 | 路由过渡 + 微交互 + 数字弹簧动效 |
| 图标 | @ant-design/icons | 6 | 2000+ 图标，覆盖分类标记场景 |
| 数据库 | PostgreSQL | 16 | ACID 事务，保证余额一致性 |
| ORM | Prisma | 5 | 类型安全，迁移工具完善 |
| 缓存 | Redis + ioredis | 7 / 5 | 分类列表缓存 1h，统计数据缓存 5min |
| 鉴权 | jose + bcryptjs | 6 / 3 | JWT 签发/验证，纯 JS 无编译依赖 |
| 部署 | Docker Compose + Nginx | — | 四服务编排，HTTPS 反向代理，多阶段构建 |

## 🚀 快速开始

### 前置条件

- Node.js 20+
- Docker 与 Docker Compose
- npm

### 开发环境

```bash
# 1. 克隆项目
git clone https://github.com/oawdji/PureBook.git
cd PureBook

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，设置 JWT_SECRET（任意字符串即可）

# 3. 启动基础设施（仅 PostgreSQL + Redis）
docker compose up postgres redis -d

# 4. 初始化数据库
npx prisma migrate dev --name init
npx prisma db seed

# 5. 启动开发服务器（热重载）
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，注册账户后即可使用。

### 生产部署

```bash
# 一键构建并启动全部服务（Nginx :443 + Next.js :3000 + PostgreSQL + Redis）
docker compose up -d --build

# 查看运行日志
docker compose logs -f app

# 健康检查
curl -k https://localhost/api/health
```

> Docker 端口映射：PostgreSQL → `5433`，Redis → `6380`，避免与本地服务冲突。

## 📖 项目结构

```
PureBook/
├── specs/                          # 📐 设计文档（按依赖顺序）
│   ├── PRD.md                      #   产品需求文档
│   ├── SPEC.md                     #   技术规范文档
│   ├── ARCHITECTURE.md             #   框架设计文档
│   └── API.md                      #   接口文档（18 个端点详细定义）
├── prisma/
│   ├── schema.prisma               # 数据模型（User / Account / Category / Transaction）
│   ├── migrations/                 # 数据库迁移文件
│   └── seed.ts                     # 种子数据（10 个预设分类）
├── docker/
│   ├── Dockerfile                  # 多阶段构建（builder → runner）
│   └── nginx.conf                  # Nginx HTTPS 反向代理 + Gzip + 安全头
├── docker-compose.yml              # 四服务编排
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # 根布局（AntdRegistry + ConfigProvider）
│   │   ├── page.tsx                # 仪表盘首页
│   │   ├── login/page.tsx          # 登录 / 注册页
│   │   ├── transactions/page.tsx   # 收支记录（筛选 + 分页 + CRUD）
│   │   ├── categories/page.tsx     # 分类管理（卡片列表 + CRUD）
│   │   ├── accounts/page.tsx       # 账户管理（卡片 + 转账 + CRUD）
│   │   ├── statistics/page.tsx     # 统计分析（饼图 + 柱状图）
│   │   └── api/                    # RESTful API Routes（13 个模块）
│   │       ├── auth/               #   登录 / 注册
│   │       ├── transactions/       #   收支 CRUD + CSV 导出
│   │       ├── categories/         #   分类管理
│   │       ├── accounts/           #   账户管理 + 转账
│   │       ├── statistics/         #   月度统计 + 趋势
│   │       └── health/             #   健康检查
│   ├── components/
│   │   ├── layout/                 # AppLayout / Header / Sidebar
│   │   ├── dashboard/              # StatCard（数字滚动统计卡片）
│   │   ├── transaction/            # TransactionDrawer（收支表单抽屉）
│   │   ├── chart/                  # PieChartCard / BarChartCard / MiniTrendChart
│   │   └── ui/                     # ConfirmModal / EmptyState / Skeleton
│   ├── hooks/                      # useCategories / useStatistics
│   ├── lib/                        # prisma / redis / auth / utils
│   ├── theme/                      # Ant Design ThemeConfig
│   └── types/                      # TypeScript 类型定义
└── .env.example                    # 环境变量模板
```

## 🗄 数据模型

```
User ──┬── Account (多账户，余额实时同步)
       ├── Category (系统预设 + 用户自定义)
       └── Transaction (收支记录，关联账户 + 分类)
```

| 实体 | 关键字段 | 核心约束 |
|------|---------|---------|
| **User** | username, password_hash | bcrypt 加密，JWT 7 天有效期 |
| **Account** | name, type, balance | Decimal(12,2)，通过 Prisma 事务同步余额 |
| **Category** | name, icon, color, is_preset | 预设分类可删除，自定义分类删除需迁移 |
| **Transaction** | type, amount, note, trans_date | 4 个复合索引优化筛选/统计查询 |

## 🔌 API 概览

所有接口遵循统一响应格式：`{ code: number, message: string, data: T | null }`，详见 [API.md](specs/API.md)。

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | — |
| POST | `/api/auth/login` | 用户登录 | — |
| GET | `/api/transactions` | 收支列表（分页 + 多条件筛选） | ✅ |
| POST | `/api/transactions` | 创建收支记录 | ✅ |
| GET | `/api/transactions/[id]` | 记录详情 | ✅ |
| PUT | `/api/transactions/[id]` | 编辑收支记录 | ✅ |
| DELETE | `/api/transactions/[id]` | 删除收支记录 | ✅ |
| GET | `/api/transactions/export` | CSV 导出 | ✅ |
| GET | `/api/categories` | 分类列表 | ✅ |
| POST | `/api/categories` | 创建自定义分类 | ✅ |
| PUT | `/api/categories/[id]` | 编辑分类 | ✅ |
| DELETE | `/api/categories/[id]` | 删除分类（支持迁移） | ✅ |
| GET | `/api/accounts` | 账户列表 | ✅ |
| POST | `/api/accounts` | 创建账户 | ✅ |
| PUT | `/api/accounts/[id]` | 编辑账户 | ✅ |
| DELETE | `/api/accounts/[id]` | 删除账户 | ✅ |
| POST | `/api/accounts/transfer` | 账户间转账 | ✅ |
| GET | `/api/statistics/monthly` | 月度统计 | ✅ |
| GET | `/api/statistics/trend` | 近 6 月趋势 | ✅ |
| GET | `/api/health` | 健康检查 | — |

## 🏗 系统架构

```
Browser (HTTPS :443)
    │
    ▼
┌────────────────────────────────────┐
│  Nginx (反向代理 + 静态资源 + Gzip) │
└────────────┬───────────────────────┘
             │ :3000
             ▼
┌────────────────────────────────────┐
│  Next.js 应用                       │
│  ┌──────────┐  ┌────────────────┐  │
│  │ 前端 SSR  │  │  API Routes   │  │
│  │ 6 个页面 │  │  13 个端点     │  │
│  └──────────┘  └───────┬────────┘  │
└─────────────────────────┼──────────┘
              │           │
       ┌──────┘           └──────┐
       ▼                         ▼
┌──────────────┐         ┌──────────────┐
│ PostgreSQL 16│         │   Redis 7    │
│  持久化数据   │         │  查询缓存    │
└──────────────┘         └──────────────┘
```

### 关键设计决策

- **缓存策略**：分类列表 Redis 缓存 1h，统计数据缓存 5min；写操作主动精准失效（`redis.keys("cache:statistics:*:${userId}")` 批量清除），而非简单 TTL
- **余额一致性**：所有 Transaction 变更在 `prisma.$transaction()` 内完成 — INSERT/UPDATE Transaction + UPDATE Account.balance 原子执行
- **安全防护**：JWT HttpOnly + Secure + SameSite=Lax Cookie，API 统一鉴权中间件，密码 bcrypt 加盐哈希
- **Docker 构建优化**：多阶段构建（builder + runner），仅保留生产依赖和构建产物，减小镜像体积

## 📦 开发命令

```bash
npm run dev              # 开发服务器（热重载，端口 3000）
npm run build            # 生产构建
npm run start            # 启动生产服务
npm run lint             # ESLint 代码检查
npm run prisma:migrate   # 数据库迁移
npm run prisma:seed      # 导入种子数据（10 个预设分类）
npm run prisma:studio    # Prisma Studio 可视化管理
```

## 📄 环境变量

```env
# .env
DATABASE_URL=postgresql://purebook:purebook123@localhost:5433/purebook
REDIS_URL=redis://localhost:6380
JWT_SECRET=<your-secret-key>
```

## 📋 License

MIT
