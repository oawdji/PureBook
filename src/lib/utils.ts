/**
 * 格式化金额为两位小数字符串
 */
export function formatAmount(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(2);
}

/**
 * 格式化金额为人民币显示（带千分位和 ¥ 符号）
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `¥${num.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 格式化月份为 YYYY-MM
 */
export function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * 获取本月第一天的日期
 */
export function getFirstDayOfMonth(year?: number, month?: number): Date {
  const now = new Date();
  return new Date(year ?? now.getFullYear(), month ?? now.getMonth(), 1);
}

/**
 * 获取本月最后一天的日期
 */
export function getLastDayOfMonth(year?: number, month?: number): Date {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth();
  return new Date(y, m + 1, 0);
}

/**
 * 获取默认的日期范围（最近 30 天）
 */
export function getDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

/**
 * 统一 API 响应格式
 */
export function apiResponse<T>(
  data: T,
  message = "success",
  code = 0
): Response {
  return Response.json({ code, message, data });
}

/**
 * 统一 API 错误响应
 */
export function apiError(
  message: string,
  code = 1001,
  status = 400
): Response {
  return Response.json({ code, message, data: null }, { status });
}

/**
 * 构建分页响应
 */
export function paginatedResponse<T>(
  list: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return {
    list,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
