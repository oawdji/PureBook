# API 接口文档（API）— PureBook 记账应用

> 基于 [SPEC.md](./SPEC.md) 的接口概览和 [ARCHITECTURE.md](./ARCHITECTURE.md) 的模块设计编写。

## 1. 全局通用规范

### 基础信息

| 项目 | 值 |
|------|-----|
| Base URL | `https://<your-domain>/api` |
| 请求格式 | `Content-Type: application/json` |
| 响应格式 | `application/json` |
| 字符编码 | UTF-8 |

### 通用响应结构

所有接口统一使用以下 JSON 结构：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 业务状态码，0 表示成功 |
| message | string | 人类可读的描述信息 |
| data | object \| array \| null | 响应数据，无数据时为 `null` |

### 状态码规范

| HTTP 状态码 | code 字段 | 含义 |
|-------------|-----------|------|
| 200 | 0 | 请求成功 |
| 201 | 0 | 创建成功 |
| 400 | 1001 | 请求参数错误 |
| 401 | 1002 | 未认证（Token 缺失或过期） |
| 403 | 1003 | 无权限访问 |
| 404 | 1004 | 资源不存在 |
| 409 | 1005 | 资源冲突（如用户名已存在） |
| 500 | 9999 | 服务器内部错误 |

### 鉴权方式

**Token 获取**：通过 `POST /api/auth/login` 或 `POST /api/auth/register` 获取 JWT。

**Token 传递**：JWT 存储在名为 `token` 的 httpOnly Secure Cookie 中，浏览器自动携带，无需手动设置 Header。

**Token 有效期**：7 天。过期后需重新登录。

**Token 刷新**：单用户场景不设 refresh token，过期后直接重新登录即可。

### 分页规范

**请求参数**（用于列表接口）：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码，从 1 开始 |
| pageSize | number | 否 | 20 | 每页条数，最大 100 |

**分页响应结构**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### 错误处理规范

错误响应示例：

```json
{
  "code": 1001,
  "message": "金额必须大于 0",
  "data": null
}
```

所有业务错误返回对应的 `code` 和清晰的 `message`，前端可直接展示 `message` 给用户。

---

## 2. 接口详情

### 认证模块

#### POST /api/auth/register — 用户注册

**请求参数**：

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| username | string | 是 | body | 用户名，3-50 字符 |
| password | string | 是 | body | 密码，6-100 字符 |

**请求示例**：

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "zhangsan",
  "password": "mypassword123"
}
```

**成功响应** (201)：

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "zhangsan"
  }
}
```

**错误响应** (409)：

```json
{
  "code": 1005,
  "message": "用户名已存在",
  "data": null
}
```

**业务规则**：
- 注册成功后自动登录，响应 Set-Cookie 设置 JWT
- 用户名全局唯一，不区分大小写

---

#### POST /api/auth/login — 用户登录

**请求参数**：

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| username | string | 是 | body | 用户名 |
| password | string | 是 | body | 密码 |

**请求示例**：

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "zhangsan",
  "password": "mypassword123"
}
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "id": 1,
    "username": "zhangsan"
  }
}
```

**错误响应** (401)：

```json
{
  "code": 1002,
  "message": "用户名或密码错误",
  "data": null
}
```

**业务规则**：
- 不区分大小写匹配用户名
- 登录成功后响应 Set-Cookie 设置 JWT，有效期 7 天
- 连续 5 次密码错误后锁定 15 分钟（Redis 计数）

---

### 交易模块

#### GET /api/transactions — 获取收支记录列表

**请求参数**：

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| page | number | 否 | query | 页码，默认 1 |
| pageSize | number | 否 | query | 每页条数，默认 20，最大 100 |
| type | string | 否 | query | 筛选类型：`income` / `expense` |
| categoryId | number | 否 | query | 筛选分类 ID |
| accountId | number | 否 | query | 筛选账户 ID |
| startDate | string | 否 | query | 开始日期，格式 YYYY-MM-DD |
| endDate | string | 否 | query | 结束日期，格式 YYYY-MM-DD |
| keyword | string | 否 | query | 搜索备注关键字 |
| minAmount | number | 否 | query | 最小金额 |
| maxAmount | number | 否 | query | 最大金额 |
| sortBy | string | 否 | query | 排序字段，默认 `trans_date` |
| sortOrder | string | 否 | query | 排序方向：`asc` / `desc`，默认 `desc` |

**请求示例**：

```http
GET /api/transactions?page=1&pageSize=20&type=expense&categoryId=3&startDate=2025-06-01&endDate=2025-06-30
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 123,
        "type": "expense",
        "amount": "45.00",
        "note": "午餐",
        "transDate": "2025-06-15",
        "createdAt": "2025-06-15T12:30:00.000Z",
        "updatedAt": "2025-06-15T12:30:00.000Z",
        "category": {
          "id": 3,
          "name": "餐饮",
          "icon": "coffee",
          "color": "#FF6B6B"
        },
        "account": {
          "id": 1,
          "name": "工资卡"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

**业务规则**：
- 默认查询最近 30 天的记录
- 金额在数据库存储为 DECIMAL，API 返回为字符串以防止精度丢失
- 联动 category 和 account 返回简要信息，避免额外请求

---

#### POST /api/transactions — 创建收支记录

**请求参数**：

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| type | string | 是 | body | `income` 或 `expense` |
| amount | number | 是 | body | 金额，> 0，最多两位小数 |
| categoryId | number | 是 | body | 分类 ID |
| accountId | number | 是 | body | 账户 ID |
| transDate | string | 是 | body | 交易日期，格式 YYYY-MM-DD |
| note | string | 否 | body | 备注，最长 200 字符 |

**请求示例**：

```http
POST /api/transactions
Content-Type: application/json

{
  "type": "expense",
  "amount": 45.00,
  "categoryId": 3,
  "accountId": 1,
  "transDate": "2025-06-15",
  "note": "午餐"
}
```

**成功响应** (201)：

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": 123,
    "type": "expense",
    "amount": "45.00",
    "categoryId": 3,
    "accountId": 1,
    "transDate": "2025-06-15",
    "note": "午餐",
    "createdAt": "2025-06-15T12:30:00.000Z"
  }
}
```

**错误响应** (400)：

```json
{
  "code": 1001,
  "message": "金额必须大于 0",
  "data": null
}
```

**业务规则**：
- 创建记录时，在数据库事务中同步更新账户余额（支出减、收入加）
- 同时删除该用户所有统计和列表的 Redis 缓存
- `transDate` 不能是未来日期

---

#### GET /api/transactions/{id} — 获取单条记录详情

**请求示例**：

```http
GET /api/transactions/123
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 123,
    "type": "expense",
    "amount": "45.00",
    "note": "午餐",
    "transDate": "2025-06-15",
    "createdAt": "2025-06-15T12:30:00.000Z",
    "updatedAt": "2025-06-15T12:30:00.000Z",
    "category": {
      "id": 3,
      "name": "餐饮",
      "icon": "coffee",
      "color": "#FF6B6B"
    },
    "account": {
      "id": 1,
      "name": "工资卡"
    }
  }
}
```

**错误响应** (404)：

```json
{
  "code": 1004,
  "message": "记录不存在",
  "data": null
}
```

**业务规则**：
- 只能查看自己的记录（通过 JWT 中的 userId 校验）

---

#### PUT /api/transactions/{id} — 更新收支记录

**请求参数**：

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| type | string | 否 | body | `income` 或 `expense` |
| amount | number | 否 | body | 金额 |
| categoryId | number | 否 | body | 分类 ID |
| accountId | number | 否 | body | 账户 ID |
| transDate | string | 否 | body | 交易日期 |
| note | string | 否 | body | 备注 |

**请求示例**：

```http
PUT /api/transactions/123
Content-Type: application/json

{
  "amount": 50.00,
  "note": "午餐 — 加了一杯咖啡"
}
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 123,
    "type": "expense",
    "amount": "50.00",
    "note": "午餐 — 加了一杯咖啡",
    "transDate": "2025-06-15",
    "updatedAt": "2025-06-15T14:00:00.000Z"
  }
}
```

**业务规则**：
- 如果修改了金额或类型（收入↔支出互换），在数据库事务中修正关联账户的余额
- 如果修改了 accountId，将原账户余额回滚，新账户余额更新
- 只传需要修改的字段，未传字段保持原值
- 同时清除该用户所有相关的 Redis 缓存

---

#### DELETE /api/transactions/{id} — 删除收支记录

**请求示例**：

```http
DELETE /api/transactions/123
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

**业务规则**：
- 在数据库事务中：删除记录 → 回滚关联账户余额 → 清除 Redis 缓存
- 软删除方案待定（当前版本硬删除）

---

#### GET /api/transactions/export — 导出 CSV

**请求参数**：

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| startDate | string | 否 | query | 开始日期，默认本月 1 日 |
| endDate | string | 否 | query | 结束日期，默认今天 |
| type | string | 否 | query | 筛选类型：`income` / `expense` / `all`，默认 `all` |

**请求示例**：

```http
GET /api/transactions/export?startDate=2025-01-01&endDate=2025-06-30&type=all
```

**成功响应** (200)：

```text
Content-Type: text/csv
Content-Disposition: attachment; filename="PureBook_2025-01-01_2025-06-30.csv"

类型,金额,分类,账户,日期,备注
支出,45.00,餐饮,工资卡,2025-06-15,午餐
收入,15000.00,工资,工资卡,2025-06-01,6月工资
```

**业务规则**：
- CSV 使用 UTF-8 BOM 编码，确保 Excel 直接打开中文不乱码
- 文件名包含导出日期范围

---

### 分类模块

#### GET /api/categories — 获取所有分类

**请求示例**：

```http
GET /api/categories
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "餐饮",
      "icon": "coffee",
      "color": "#FF6B6B",
      "isPreset": true
    },
    {
      "id": 9,
      "name": "宠物",
      "icon": "github",
      "color": "#9B59B6",
      "isPreset": false
    }
  ]
}
```

**业务规则**：
- 返回系统预设 + 该用户自定义的所有分类
- 结果按 `isPreset` 降序（预设在前）、`createdAt` 升序排列
- 分类列表缓存 Redis 直到用户修改分类时失效

---

#### POST /api/categories — 创建自定义分类

**请求参数**：

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| name | string | 是 | body | 分类名称，最长 30 字符 |
| icon | string | 是 | body | 图标标识 |
| color | string | 是 | body | HEX 颜色值，如 `#FF6B6B` |

**请求示例**：

```http
POST /api/categories
Content-Type: application/json

{
  "name": "宠物",
  "icon": "github",
  "color": "#9B59B6"
}
```

**成功响应** (201)：

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": 9,
    "name": "宠物",
    "icon": "github",
    "color": "#9B59B6",
    "isPreset": false
  }
}
```

**错误响应** (409)：

```json
{
  "code": 1005,
  "message": "该分类名称已存在",
  "data": null
}
```

**业务规则**：
- 同名分类不区分大小写去重
- `isPreset` 强制为 `false`
- 创建后立即失效 Redis 分类缓存

---

#### PUT /api/categories/{id} — 编辑分类

**请求参数**：

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| name | string | 否 | body | 分类名称 |
| icon | string | 否 | body | 图标标识 |
| color | string | 否 | body | HEX 颜色值 |

**请求示例**：

```http
PUT /api/categories/9
Content-Type: application/json

{
  "color": "#8E44AD"
}
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 9,
    "name": "宠物",
    "icon": "github",
    "color": "#8E44AD",
    "isPreset": false
  }
}
```

**业务规则**：
- 系统预设分类（`isPreset: true`）不可编辑，返回 403
- 修改后失效分类缓存

---

#### DELETE /api/categories/{id} — 删除分类

**请求参数**：

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| migrateToId | number | 是 | query | 迁移目标分类 ID |

**请求示例**：

```http
DELETE /api/categories/9?migrateToId=8
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "删除成功，3 条记录已迁移至「其他」",
  "data": {
    "migratedCount": 3
  }
}
```

**错误响应** (400)：

```json
{
  "code": 1001,
  "message": "请指定迁移目标分类",
  "data": null
}
```

**业务规则**：
- 系统预设分类不可删除，返回 403
- 删除时必须提供 `migrateToId`，该分类下的所有 Transaction 迁移至目标分类
- 操作在数据库事务中完成：UPDATE transactions → DELETE category → 失效缓存

---

### 账户模块

#### GET /api/accounts — 获取所有账户

**请求示例**：

```http
GET /api/accounts
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "工资卡",
      "type": "bank",
      "balance": "23450.50",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "微信零钱",
      "type": "cash",
      "balance": "320.00",
      "createdAt": "2025-01-15T00:00:00.000Z"
    }
  ]
}
```

**业务规则**：
- 余额通过数据库实时计算（SUM 该账户所有收支记录），确保准确性

---

#### POST /api/accounts — 创建账户

**请求参数**：

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| name | string | 是 | body | 账户名称，最长 50 字符 |
| type | string | 是 | body | 账户类型：`cash` / `bank` / `credit` |
| initialBalance | number | 否 | body | 初始余额，默认 0 |

**请求示例**：

```http
POST /api/accounts
Content-Type: application/json

{
  "name": "信用卡",
  "type": "credit",
  "initialBalance": 0
}
```

**成功响应** (201)：

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": 3,
    "name": "信用卡",
    "type": "credit",
    "balance": "0.00"
  }
}
```

**业务规则**：
- 如果 `initialBalance > 0`，自动创建一条类型为 `income` 的初始 Transaction 记录

---

#### PUT /api/accounts/{id} — 编辑账户

**请求参数**：

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| name | string | 否 | body | 账户名称 |
| type | string | 否 | body | 账户类型 |

**请求示例**：

```http
PUT /api/accounts/1
Content-Type: application/json

{
  "name": "招商银行储蓄卡"
}
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 1,
    "name": "招商银行储蓄卡",
    "type": "bank",
    "balance": "23450.50"
  }
}
```

**业务规则**：
- 账户余额通过关联记录自动计算，不允许手动修改

---

#### DELETE /api/accounts/{id} — 删除账户

**请求参数**：

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| migrateToId | number | 条件必填 | query | 迁移目标账户 ID，有关联记录时必填 |

**请求示例**：

```http
DELETE /api/accounts/2?migrateToId=1
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "删除成功，15 条记录已迁移至「招商银行储蓄卡」",
  "data": {
    "migratedCount": 15
  }
}
```

**业务规则**：
- 如果该账户下有关联 Transaction，必须提供迁移目标账户
- 迁移后，迁移目标的余额自动重新计算
- 必须保留至少一个账户

---

#### POST /api/accounts/transfer — 账户间转账

**请求参数**：

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| fromAccountId | number | 是 | body | 源账户 ID |
| toAccountId | number | 是 | body | 目标账户 ID |
| amount | number | 是 | body | 转账金额 |
| note | string | 否 | body | 备注 |

**请求示例**：

```http
POST /api/accounts/transfer
Content-Type: application/json

{
  "fromAccountId": 1,
  "toAccountId": 2,
  "amount": 500.00,
  "note": "转到微信零钱"
}
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "转账成功",
  "data": {
    "fromTransactionId": 201,
    "toTransactionId": 202
  }
}
```

**业务规则**：
- 在数据库事务中完成：源账户创建支出记录 → 目标账户创建收入记录
- `fromAccountId` 和 `toAccountId` 不能相同
- 转账金额必须 > 0

---

### 统计模块

#### GET /api/statistics/monthly — 月度统计概览

**请求参数**：

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| month | string | 否 | query | 月份，格式 YYYY-MM，默认当前月 |

**请求示例**：

```http
GET /api/statistics/monthly?month=2025-06
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "month": "2025-06",
    "totalIncome": "15000.00",
    "totalExpense": "8200.50",
    "balance": "6799.50",
    "categoryBreakdown": [
      {
        "categoryId": 3,
        "categoryName": "餐饮",
        "categoryIcon": "coffee",
        "categoryColor": "#FF6B6B",
        "amount": "2100.00",
        "percentage": 25.6,
        "count": 45
      },
      {
        "categoryId": 1,
        "categoryName": "交通",
        "categoryIcon": "car",
        "categoryColor": "#4ECDC4",
        "amount": "800.00",
        "percentage": 9.8,
        "count": 12
      }
    ],
    "dailySummary": [
      { "date": "2025-06-01", "income": "15000.00", "expense": "200.00" },
      { "date": "2025-06-02", "income": "0", "expense": "150.00" }
    ]
  }
}
```

**业务规则**：
- `categoryBreakdown` 仅返回支出分类（expense 类型），按金额降序排列
- `percentage` 为该分类占当月总支出的百分比
- 统计结果缓存 Redis 5 分钟

---

#### GET /api/statistics/trend — 近 6 月收支趋势

**请求示例**：

```http
GET /api/statistics/trend
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "months": [
      {
        "month": "2025-01",
        "income": "12000.00",
        "expense": "9500.00",
        "balance": "2500.00"
      },
      {
        "month": "2025-02",
        "income": "13000.00",
        "expense": "8700.00",
        "balance": "4300.00"
      },
      {
        "month": "2025-03",
        "income": "12000.00",
        "expense": "10200.00",
        "balance": "1800.00"
      },
      {
        "month": "2025-04",
        "income": "14000.00",
        "expense": "9100.00",
        "balance": "4900.00"
      },
      {
        "month": "2025-05",
        "income": "12000.00",
        "expense": "8800.00",
        "balance": "3200.00"
      },
      {
        "month": "2025-06",
        "income": "15000.00",
        "expense": "8200.50",
        "balance": "6799.50"
      }
    ]
  }
}
```

**业务规则**：
- 固定返回最近 6 个自然月（含当前月）的数据
- 某月无数据时返回 `{ income: "0", expense: "0", balance: "0" }`
- 结果缓存 Redis 5 分钟

---

### 健康检查

#### GET /api/health — 服务健康检查

**请求示例**：

```http
GET /api/health
```

**成功响应** (200)：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "status": "healthy",
    "uptime": 86400,
    "checks": {
      "database": "connected",
      "redis": "connected"
    }
  }
}
```

**业务规则**：
- 不需要鉴权
- 检查 PostgreSQL 和 Redis 连通性
- Docker 健康检查使用此端点
