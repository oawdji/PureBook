# PureBook — 个人记账应用

简单优雅的个人 Web 记账应用，以丰富的图表和直观的交互界面帮助记录日常收支、分类管理，并通过可视化的统计仪表盘展示财务状况。

![Tech Stack](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18-%2361DAFB?logo=react)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5-%230170FE?logo=antdesign)
![Prisma](https://img.shields.io/badge/Prisma-5-%232D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-%234169E1?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-%23DC382D?logo=redis)
![Docker](https://img.shields.io/badge/Docker-Compose-%232496ED?logo=docker)

## 功能特性

- 📊 **仪表盘首页** — 本月收支概览卡片 + 数字滚动动效 + 近 6 月趋势迷你图
- 💰 **收支记录** — CRUD、多条件筛选（分类/账户/日期/金额/关键字）、CSV 导出
- 🏷️ **分类管理** — 10 个系统预设分类 + 自定义分类，支持迁移删除
- 🏦 **账户管理** — 多账户余额追踪、账户间转账
- 📈 **统计分析** — 月度分类占比饼图 + 近 6 月收支柱状图
- 🌙 **深色模式** — 一键切换浅色/深色主题，平滑过渡
- 🎨 **动画交互** — framer-motion 路由过渡、stagger 入场、微交互反馈
- 🐳 **Docker 部署** — 一键启动 Nginx + Next.js + PostgreSQL + Redis

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 14 (App Router) + React 18 + TypeScript |
| CSS | Tailwind CSS 3 + Ant Design 5 |
| 动画 | framer-motion + @react-spring/web |
| 图表 | Recharts 2 |
| 数据库 | PostgreSQL 16 (Prisma ORM 5) |
| 缓存 | Redis 7 (ioredis) |
| 鉴权 | JWT (jose) + bcryptjs |
| 部署 | Docker Compose (Nginx + App + PostgreSQL + Redis) |

## 快速开始

### 前置条件

- Node.js 20+
- Docker 及 Docker Compose
- npm

### 开发环境

```bash
# 1. 克隆项目
git clone https://github.com/oawdji/PureBook.git
cd PureBook

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，设置 JWT_SECRET 等

# 3. 启动基础设施
docker compose up postgres redis -d

# 4. 数据库迁移与种子数据
npx prisma migrate dev --name init
npx prisma db seed

# 5. 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，注册账户即可使用。

### 生产部署

```bash
# 构建并启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f

# 健康检查
curl https://localhost/api/health
```

## 项目结构

```
PureBook/
├── prisma/
│   ├── schema.prisma          # 数据模型 (User/Account/Category/Transaction)
│   └── seed.ts                # 预设分类种子数据
├── docker/
│   ├── Dockerfile             # Next.js 多阶段构建
│   └── nginx.conf             # Nginx 反向代理配置
├── docker-compose.yml         # 四服务编排
├── specs/                     # 设计文档
│   ├── PRD.md                 # 产品需求文档
│   ├── SPEC.md                # 技术规范文档
│   ├── ARCHITECTURE.md        # 框架设计文档
│   └── API.md                 # 接口文档 (18 个端点)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 仪表盘首页
│   │   ├── login/page.tsx     # 登录/注册页
│   │   ├── transactions/      # 收支记录页
│   │   ├── categories/        # 分类管理页
│   │   ├── accounts/          # 账户管理页
│   │   ├── statistics/        # 统计分析页
│   │   └── api/               # RESTful API Routes
│   ├── components/
│   │   ├── layout/            # Header, Sidebar, AppLayout
│   │   ├── dashboard/         # StatCard 统计卡片
│   │   ├── transaction/       # TransactionDrawer 编辑抽屉
│   │   ├── chart/             # PieChart, BarChart, TrendChart
│   │   └── ui/                # EmptyState, ConfirmModal, Skeleton
│   ├── hooks/                 # useCategories, useStatistics, useTheme
│   ├── lib/                   # prisma, redis, auth, utils
│   ├── theme/                 # light/dark 主题变量
│   └── types/                 # TypeScript 类型定义
└── .env.example               # 环境变量模板
```

## API 接口

所有接口遵循 `{ code, message, data }` 统一响应格式，详见 [API.md](specs/API.md)。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET/POST | `/api/categories` | 分类列表 / 新建 |
| PUT/DELETE | `/api/categories/[id]` | 编辑 / 删除分类 |
| GET/POST | `/api/accounts` | 账户列表 / 新建 |
| PUT/DELETE | `/api/accounts/[id]` | 编辑 / 删除账户 |
| POST | `/api/accounts/transfer` | 转账 |
| GET/POST | `/api/transactions` | 记录列表(分页+筛选) / 新建 |
| GET/PUT/DELETE | `/api/transactions/[id]` | 详情 / 编辑 / 删除 |
| GET | `/api/transactions/export` | CSV 导出 |
| GET | `/api/statistics/monthly` | 月度统计 |
| GET | `/api/statistics/trend` | 近 6 月趋势 |
| GET | `/api/health` | 健康检查 |

## 开发命令

```bash
npm run dev              # 启动开发服务器
npm run build            # 生产构建
npm run start            # 启动生产服务
npm run lint             # ESLint 检查
npm run prisma:migrate   # 数据库迁移
npm run prisma:seed      # 导入种子数据
npm run prisma:studio    # Prisma Studio 可视化
```

## License

MIT
