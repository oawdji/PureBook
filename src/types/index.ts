// ---- 基础类型 ----

export type TransactionType = "income" | "expense";

export type AccountType = "cash" | "bank" | "credit";

// ---- 实体类型 ----

export interface UserInfo {
  id: number;
  username: string;
}

export interface CategoryInfo {
  id: number;
  name: string;
  icon: string;
  color: string;
  isPreset: boolean;
}

export interface AccountInfo {
  id: number;
  name: string;
  type: AccountType;
  balance: string;
  createdAt: string;
}

export interface TransactionInfo {
  id: number;
  type: TransactionType;
  amount: string;
  note: string | null;
  transDate: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: number;
    name: string;
    icon: string;
    color: string;
  };
  account: {
    id: number;
    name: string;
  };
}

// ---- API 请求类型 ----

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: number;
  accountId: number;
  transDate: string;
  note?: string;
}

export interface UpdateTransactionInput {
  type?: TransactionType;
  amount?: number;
  categoryId?: number;
  accountId?: number;
  transDate?: string;
  note?: string;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
  color: string;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  initialBalance?: number;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
}

export interface TransferInput {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  note?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

// ---- API 响应类型 ----

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  list: T[];
  pagination: PaginationInfo;
}

export interface TransactionListQuery {
  page?: number;
  pageSize?: number;
  type?: TransactionType;
  categoryId?: number;
  accountId?: number;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ---- 统计类型 ----

export interface MonthlyStatItem {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: string;
  percentage: number;
  count: number;
}

export interface DailySummaryItem {
  date: string;
  income: string;
  expense: string;
}

export interface MonthlyStats {
  month: string;
  totalIncome: string;
  totalExpense: string;
  balance: string;
  categoryBreakdown: MonthlyStatItem[];
  dailySummary: DailySummaryItem[];
}

export interface TrendItem {
  month: string;
  income: string;
  expense: string;
  balance: string;
}

export interface TrendData {
  months: TrendItem[];
}
