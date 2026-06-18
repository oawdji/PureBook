"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Select,
  Input,
  Row,
  Col,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  SearchOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import TransactionDrawer from "@/components/transaction/TransactionDrawer";
import ConfirmModal from "@/components/ui/ConfirmModal";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import type { TransactionInfo, CategoryInfo, AccountInfo } from "@/types";
import { formatCurrency } from "@/lib/utils";

const { Text } = Typography;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });

  // 筛选状态
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  // 抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 删除状态
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 加载数据
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (filters.type) params.set("type", filters.type as string);
    if (filters.categoryId)
      params.set("categoryId", String(filters.categoryId));
    if (filters.accountId)
      params.set("accountId", String(filters.accountId));
    if (filters.keyword) params.set("keyword", filters.keyword as string);

    try {
      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      if (data.code === 0) {
        setTransactions(data.data.list);
        setPagination((prev) => ({ ...prev, total: data.data.pagination.total }));
      } else if (data.code === 1002) {
        window.location.href = "/login";
      }
    } catch {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters]);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (data.code === 0) setCategories(data.data);
  }, []);

  const fetchAccounts = useCallback(async () => {
    const res = await fetch("/api/accounts");
    const data = await res.json();
    if (data.code === 0) setAccounts(data.data);
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchAccounts();
  }, [fetchCategories, fetchAccounts]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // 删除
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${deleteTarget}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.code === 0) {
        message.success("删除成功");
        setDeleteTarget(null);
        fetchTransactions();
      } else {
        message.error(data.message);
      }
    } catch {
      message.error("删除失败");
    } finally {
      setDeleting(false);
    }
  };

  // 导出 CSV
  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.set("startDate", filters.startDate as string);
    if (filters.endDate) params.set("endDate", filters.endDate as string);
    window.open(`/api/transactions/export?${params.toString()}`, "_blank");
  };

  const columns: ColumnsType<TransactionInfo> = [
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 80,
      render: (type: string) => (
        <Tag color={type === "income" ? "green" : "red"}>
          {type === "income" ? "收入" : "支出"}
        </Tag>
      ),
    },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (amount: string, record) => (
        <Text
          strong
          className={
            record.type === "income" ? "text-green-500" : "text-red-500"
          }
        >
          {record.type === "income" ? "+" : "-"}
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: "分类",
      key: "category",
      width: 120,
      render: (_, record) => (
        <Tag color={record.category.color}>
          {record.category.name}
        </Tag>
      ),
    },
    {
      title: "账户",
      dataIndex: ["account", "name"],
      key: "account",
      width: 100,
    },
    {
      title: "日期",
      dataIndex: "transDate",
      key: "transDate",
      width: 220,
    },
    {
      title: "备注",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
      render: (note: string | null) => (
        <Text type="secondary">{note || "-"}</Text>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setEditingId(record.id);
              setDrawerOpen(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => setDeleteTarget(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Typography.Title level={4} className="!mb-4">
        收支记录
      </Typography.Title>

      {/* 筛选栏 */}
      <div className="bg-white p-4 rounded-lg mb-4 shadow-sm">
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={6}>
            <Select
              placeholder="类型"
              allowClear
              className="w-full"
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, type: val }))
              }
              options={[
                { value: "income", label: "收入" },
                { value: "expense", label: "支出" },
              ]}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder="分类"
              allowClear
              className="w-full"
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, categoryId: val }))
              }
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder="账户"
              allowClear
              className="w-full"
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, accountId: val }))
              }
              options={accounts.map((a) => ({
                value: a.id,
                label: a.name,
              }))}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Input
              placeholder="搜索备注"
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, keyword: e.target.value }))
              }
            />
          </Col>
        </Row>
      </div>

      {/* 操作栏 */}
      <div className="flex justify-between mb-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingId(null);
            setDrawerOpen(true);
          }}
        >
          记一笔
        </Button>
        <Button icon={<ExportOutlined />} onClick={handleExport}>
          导出 CSV
        </Button>
      </div>

      {/* 列表 */}
      {loading && !transactions.length ? (
        <Skeleton loading rows={8} />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="暂无收支记录"
          description="点击「记一笔」开始记录"
          actionText="记一笔"
          onAction={() => {
            setEditingId(null);
            setDrawerOpen(true);
          }}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) =>
              setPagination((prev) => ({ ...prev, page, pageSize })),
          }}
          className="!bg-white !shadow-sm !rounded-lg"
        />
      )}

      {/* 编辑抽屉 */}
      <TransactionDrawer
        open={drawerOpen}
        editingId={editingId}
        categories={categories}
        accounts={accounts}
        onClose={() => {
          setDrawerOpen(false);
          setEditingId(null);
        }}
        onSuccess={() => {
          setDrawerOpen(false);
          setEditingId(null);
          fetchTransactions();
        }}
      />

      {/* 删除确认 */}
      <ConfirmModal
        open={deleteTarget !== null}
        title="确认删除"
        content="删除后不可恢复，确定要删除这条记录吗？"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        danger
      />
    </motion.div>
  );
}
