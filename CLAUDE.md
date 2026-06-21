# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**PureBook** — 个人 Web 记账应用。单用户、桌面端优先，以丰富的图表和动画交互展示财务数据。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Next.js 14 (App Router) + TypeScript |
| CSS | Tailwind CSS 3 + Ant Design 6 |
| 动画 | framer-motion 12 |
| 图表 | Recharts 3 |
| 数据库 | PostgreSQL 16 (Prisma ORM 5) |
| 缓存 | Redis 7 (ioredis) |
| 认证 | JWT (jose) + bcryptjs + HttpOnly Cookie |
| 部署 | Docker Compose (Nginx + Next.js + PostgreSQL + Redis) |

## 项目文档

所有设计文档位于 [specs/](specs/) 目录，按依赖顺序排列：

| 文件 | 内容 | 依赖 |
|------|------|------|
| [PRD.md](specs/PRD.md) | 产品需求：功能定义、用户故事、验收标准、视觉交互规范 | — |
| [SPEC.md](specs/SPEC.md) | 技术规范：技术选型、数据模型、API 概览、目录结构、动画模式 | PRD |
| [ARCHITECTURE.md](specs/ARCHITECTURE.md) | 框架设计：系统架构图、模块划分、数据流、部署架构 | SPEC |
| [API.md](specs/API.md) | 接口文档：全局规范、18 个 RESTful 端点详细定义 | SPEC + ARCHITECTURE |

修改任何功能前，先查阅对应的设计文档。修改设计文档后，同步更新依赖它的下游文档。

## 项目结构

```
PureBook/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # 根布局（AntdRegistry + AppLayout）
│   │   ├── page.tsx                  # 仪表盘首页
│   │   ├── globals.css               # Tailwind + Ant Design 样式覆盖
│   │   ├── login/page.tsx            # 登录/注册页（Tabs 切换）
│   │   ├── transactions/page.tsx     # 收支记录（筛选 + 分页 + CRUD）
│   │   ├── categories/page.tsx       # 分类管理（卡片列表 + CRUD）
│   │   ├── accounts/page.tsx         # 账户管理（卡片 + 转账 + CRUD）
│   │   ├── statistics/page.tsx       # 统计分析（饼图 + 柱状图）
│   │   └── api/                      # Next.js API Routes（13 个端点）
│   │       ├── auth/login/route.ts
│   │       ├── auth/register/route.ts
│   │       ├── transactions/route.ts       # GET (分页筛选) + POST
│   │       ├── transactions/[id]/route.ts  # GET + PUT + DELETE
│   │       ├── transactions/export/route.ts # GET CSV 导出
│   │       ├── categories/route.ts         # GET + POST
│   │       ├── categories/[id]/route.ts    # PUT + DELETE (带迁移)
│   │       ├── accounts/route.ts           # GET + POST (含初始余额)
│   │       ├── accounts/[id]/route.ts      # PUT + DELETE (带迁移)
│   │       ├── accounts/transfer/route.ts  # POST 转账
│   │       ├── statistics/monthly/route.ts # GET 月度统计
│   │       ├── statistics/trend/route.ts   # GET 近 6 月趋势
│   │       └── health/route.ts             # GET 健康检查
│   ├── components/
│   │   ├── layout/AppLayout.tsx       # Ant Design Layout 骨架（登录页跳过）
│   │   ├── layout/Header.tsx          # 顶部栏（折叠按钮）
│   │   ├── layout/Sidebar.tsx         # 侧边菜单（5 个导航项）
│   │   ├── dashboard/StatCard.tsx     # 统计卡片（动画数值）
│   │   ├── transaction/TransactionDrawer.tsx  # 收支表单抽屉
│   │   ├── chart/PieChartCard.tsx     # 饼图卡片
│   │   ├── chart/BarChartCard.tsx     # 柱状图卡片
│   │   ├── chart/MiniTrendChart.tsx   # 迷你趋势图
│   │   └── ui/                        # ConfirmModal, EmptyState, Skeleton
│   ├── lib/
│   │   ├── prisma.ts                  # PrismaClient 单例
│   │   ├── redis.ts                   # Redis 单例（开发环境全局缓存）
│   │   ├── auth.ts                    # JWT 签发/验证 + Cookie 读取
│   │   └── utils.ts                   # 工具函数（金额格式化、日期、API 响应）
│   ├── hooks/
│   │   ├── useCategories.ts           # 分类列表 + 刷新
│   │   └── useStatistics.ts           # 月度统计 + 趋势
│   ├── types/index.ts                 # 所有 TypeScript 类型定义
│   └── theme/
│       ├── index.ts                   # 主题导出（当前仅 light 主题）
│       └── light.ts                   # Ant Design ThemeConfig
├── prisma/
│   ├── schema.prisma                  # User, Account, Category, Transaction
│   └── seed.ts                        # 10 个预设分类（餐饮、交通、购物…）
├── docker/
│   ├── Dockerfile                     # 多阶段构建（builder + runner）
│   └── nginx.conf                     # HTTPS 反向代理（自签名证书）
├── docker-compose.yml                 # 4 服务：nginx + app + postgres + redis
└── next.config.mjs                    # transpilePackages（antd 等）
```

## 开发命令

```bash
# 开发环境 — 启动基础设施 + 热重载
npm run dev                          # Next.js dev server（端口 3000）

# 仅启动基础服务（不需要前端热重载时）
docker compose up postgres redis -d

# 数据库操作
npm run prisma:migrate               # 执行迁移（npx prisma migrate dev）
npm run prisma:seed                  # 导入 10 个预设分类
npm run prisma:studio                # Prisma Studio 可视化管理

# 生产构建
docker compose up -d                 # 构建并启动全部服务（nginx:443）

# 代码检查
npm run lint                         # next lint
```

### 环境变量

开发时需要 `.env` 文件：

```
DATABASE_URL=postgresql://purebook:purebook123@localhost:5433/purebook
REDIS_URL=redis://localhost:6380
JWT_SECRET=<your-secret>
```

Docker 端口说明：PostgreSQL 映射到 `5433`，Redis 映射到 `6380`，避免与本地服务冲突。

## 数据模型（Prisma）

```
User (1) ──< (N) Account        # balance 为 Decimal(12,2)，通过事务同步
User (1) ──< (N) Category       # isPreset 区分系统预设（userId=null）vs 用户自定义
User (1) ──< (N) Transaction    # type: income|expense，关联 Account + Category
```

关键约束与实现细节：
- **余额一致性**：创建/修改/删除 Transaction 时，在 `prisma.$transaction()` 中同步更新 `Account.balance`。PUT 操作先回滚旧记录对余额的影响，再应用新记录的影响
- **分类删除**：系统预设分类（`isPreset: true`）可删除但影响所有用户；用户自定义分类删除时，需通过 `migrateToId` 参数将关联记录迁移到目标分类
- **账户删除**：若有关联记录，必须指定 `migrateToId` 迁移；至少保留一个账户
- **Decimal 处理**：Prisma Decimal 类型在 API 响应中需调用 `.toString()` 转换，Prisma 查询中使用 `new Prisma.Decimal(value)`
- **索引**：Transaction 表有 `[userId, transDate]`、`[userId, categoryId]`、`[userId, type]`、`[accountId]` 四个复合索引

## 核心架构模式

### 认证流程

- JWT 通过 HttpOnly + Secure + SameSite=Lax Cookie 传递（7 天有效期）
- `src/lib/auth.ts` 提供 `signToken`、`verifyToken`、`getCurrentUser`（Server Component）、`verifyAuth`（API Route）
- 每个 API Route 首先调用 `verifyAuth(request)` 验证身份，返回 `401` + code `1002`
- 登录保护：API 层是真正的鉴权层；前端 `AppLayout` 中登录页跳过布局骨架；`page.tsx` 仪表盘会检查 API 返回码，未登录跳转 `/login`

### API 统一响应

所有 API 返回格式 `{ code: number, message: string, data: T | null }`：
- `code: 0` — 成功
- `code: 1001` — 参数错误（400）
- `code: 1002` — 未登录（401）
- `code: 1003` — 无权限（403）
- `code: 1004` — 资源不存在（404）
- `code: 1005` — 冲突（409，如用户名/分类名重复）
- `code: 9999` — 服务器内部错误（500）

使用 `apiResponse(data, message?, code?)` 和 `apiError(message, code?, status?)` 构建响应。

### 统计缓存策略

- 分类列表：Redis 缓存 1 小时，增删改时通过 `redis.del("categories:list:${userId}")` 失效
- 月度统计 / 趋势：Redis 缓存 5 分钟（300s），Transaction 增删改时通过 `redis.keys("cache:statistics:*:${userId}")` 批量失效

### 前端数据流

- 所有页面组件为 `"use client"`（通过 fetch 调用 API）
- 自定义 hooks（`useCategories`、`useMonthlyStats`、`useTrend`）封装数据获取和 loading 状态
- 动画：页面进入使用 `framer-motion` 的 `initial/animate/transition`，卡片交错延迟 `index * 0.05`
- Ant Design 主题通过 `ConfigProvider locale={zhCN} theme={lightTheme}` 全局注入
- `next.config.mjs` 中 `transpilePackages` 包含 antd 及其依赖（rc-* 系列），确保 ESM 兼容

### 部署架构

```
Browser → Nginx (:443, 自签名证书) → Next.js (:3000) → PostgreSQL + Redis
                                   HTTP → HTTPS 301 重定向
```

- Dockerfile 为多阶段构建：builder 阶段 `npm ci --ignore-scripts` → 复制源码 → `prisma generate` → `next build`，runner 阶段仅复制必要产物
- Nginx 配置 Gzip 压缩、静态资源缓存（`/_next/static` 365天）、安全头（X-Frame-Options, X-Content-Type-Options, X-XSS-Protection）

<!-- superpowers-zh:begin (do not edit between these markers) -->
# Superpowers-ZH 中文增强版

本项目已安装 superpowers-zh 技能框架（20 个 skills）。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令

## 可用 Skills

Skills 位于 `.claude/skills/` 目录，每个 skill 有独立的 `SKILL.md` 文件。

- **brainstorming**: 在任何创造性工作之前必须使用此技能——创建功能、构建组件、添加功能或修改行为。在实现之前先探索用户意图、需求和设计。
- **chinese-code-review**: 中文 review 沟通参考——话术模板、分级标注（必须修复/建议修改/仅供参考）、国内团队常见反模式应对。仅在用户显式 /chinese-code-review 时调用，不要根据上下文自动触发。
- **chinese-commit-conventions**: 中文 commit 与 changelog 配置参考——Conventional Commits 中文适配、commitlint/husky/commitizen 中文模板、conventional-changelog 中文配置。仅在用户显式 /chinese-commit-conventions 时调用，不要根据上下文自动触发。
- **chinese-documentation**: 中文文档排版参考——中英文空格、全半角标点、术语保留、链接格式、中文文案排版指北约定。仅在用户显式 /chinese-documentation 时调用，不要根据上下文自动触发。
- **chinese-git-workflow**: 国内 Git 平台配置参考——Gitee、Coding.net、极狐 GitLab、CNB 的 SSH/HTTPS/凭据/CI 接入差异与镜像同步配置。仅在用户显式 /chinese-git-workflow 时调用，不要根据上下文自动触发。
- **dispatching-parallel-agents**: 当面对 2 个以上可以独立进行、无共享状态或顺序依赖的任务时使用
- **executing-plans**: 当你有一份书面实现计划需要在单独的会话中执行，并设有审查检查点时使用
- **finishing-a-development-branch**: 当实现完成、所有测试通过、需要决定如何集成工作时使用——通过提供合并、PR 或清理等结构化选项来引导开发工作的收尾
- **mcp-builder**: MCP 服务器构建方法论 — 系统化构建生产级 MCP 工具，让 AI 助手连接外部能力
- **receiving-code-review**: 收到代码审查反馈后、实施建议之前使用，尤其当反馈不明确或技术上有疑问时——需要技术严谨性和验证，而非敷衍附和或盲目执行
- **requesting-code-review**: 完成任务、实现重要功能或合并前使用，用于验证工作成果是否符合要求
- **subagent-driven-development**: 当在当前会话中执行包含独立任务的实现计划时使用
- **systematic-debugging**: 遇到任何 bug、测试失败或异常行为时使用，在提出修复方案之前执行
- **test-driven-development**: 在实现任何功能或修复 bug 时使用，在编写实现代码之前
- **using-git-worktrees**: 当需要开始与当前工作区隔离的功能开发，或在执行实现计划之前使用——通过原生工具或 git worktree 回退机制确保隔离工作区存在
- **using-superpowers**: 在开始任何对话时使用——确立如何查找和使用技能，要求在任何响应（包括澄清性问题）之前调用 Skill 工具
- **verification-before-completion**: 在宣称工作完成、已修复或测试通过之前使用，在提交或创建 PR 之前——必须运行验证命令并确认输出后才能声称成功；始终用证据支撑断言
- **workflow-runner**: 在 Claude Code / OpenClaw / Cursor 中直接运行 agency-orchestrator YAML 工作流——无需 API key，使用当前会话的 LLM 作为执行引擎。当用户提供 .yaml 工作流文件或要求多角色协作完成任务时触发。
- **writing-plans**: 当你有规格说明或需求用于多步骤任务时使用，在动手写代码之前
- **writing-skills**: 当创建新技能、编辑现有技能或在部署前验证技能是否有效时使用

## 如何使用

当任务匹配某个 skill 时，使用 `Skill` 工具加载对应 skill 并严格遵循其流程。绝不要用 Read 工具读取 SKILL.md 文件。

如果你认为哪怕只有 1% 的可能性某个 skill 适用于你正在做的事情，你必须调用该 skill 检查。
<!-- superpowers-zh:end -->
