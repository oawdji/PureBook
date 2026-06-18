# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**PureBook** — 个人 Web 记账应用。单用户、桌面端优先，以丰富的图表和动画交互展示财务数据。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Next.js 14 (App Router) + TypeScript |
| CSS | Tailwind CSS 3 + Ant Design 5 |
| 动画 | framer-motion 10 |
| 图表 | Recharts 2 |
| 数据库 | PostgreSQL 16 (Prisma ORM) |
| 缓存 | Redis 7 |
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

## 项目结构（规划中）

```
PureBook/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 仪表盘首页
│   │   ├── login/page.tsx
│   │   ├── transactions/       # 收支记录
│   │   ├── categories/         # 分类管理
│   │   ├── accounts/           # 账户管理
│   │   └── statistics/         # 统计页
│   ├── api/                    # Next.js API Routes
│   │   ├── auth/               # 认证
│   │   ├── transactions/       # 交易 CRUD
│   │   ├── categories/         # 分类 CRUD
│   │   ├── accounts/           # 账户 CRUD + 转账
│   │   └── statistics/         # 统计聚合
│   ├── components/             # React 组件
│   │   ├── layout/             # Header, Sidebar
│   │   ├── dashboard/          # 概览卡片
│   │   ├── transaction/        # 记录表单、列表
│   │   ├── category/           # 分类选择器
│   │   ├── chart/              # 图表封装
│   │   └── ui/                 # 通用 UI
│   ├── lib/                    # 工具库 (prisma, redis, auth, utils)
│   ├── hooks/                  # 自定义 Hooks
│   ├── theme/                  # 浅色/深色主题
│   └── types/                  # TypeScript 类型
├── prisma/
│   ├── schema.prisma           # 数据模型定义
│   └── seed.ts                 # 预设分类种子数据
├── docker/
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

## 开发命令（待项目初始化后可用）

```bash
# 开发环境 — 仅启动基础设施，前端热重载
docker compose up postgres redis -d
npm run dev

# 数据库迁移
npx prisma migrate dev
npx prisma db seed            # 导入预设分类

# 生产构建
docker compose up -d

# 代码检查与格式化（待配置）
npm run lint
npm run format
```

## 数据模型核心关系

```
User (1) ──< (N) Account
User (1) ──< (N) Category    # is_preset 区分系统预设 vs 用户自定义
User (1) ──< (N) Transaction # 每笔记录关联 Account + Category
```

关键约束：
- 删除分类时，`is_preset: true` 不可删；自定义分类需迁移关联记录到目标分类
- 创建/修改/删除 Transaction 时，在数据库事务中同步更新 Account.balance
- 统计查询结果缓存 Redis 5 分钟

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
