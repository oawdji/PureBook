"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Typography,
  Tag,
  Row,
  Col,
  Space,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import EmptyState from "@/components/ui/EmptyState";
import type { AccountInfo } from "@/types";
import { formatCurrency } from "@/lib/utils";

const { Title, Text } = Typography;

const accountTypeLabels: Record<string, string> = {
  cash: "现金",
  bank: "银行",
  credit: "信用卡",
  payment: "支付软件",
};

const accountTypeColors: Record<string, string> = {
  cash: "green",
  bank: "blue",
  credit: "purple",
  payment: "orange",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // 编辑弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // 转账弹窗
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferForm] = Form.useForm();
  const [transferring, setTransferring] = useState(false);

  // 删除
  const [deleteTarget, setDeleteTarget] = useState<AccountInfo | null>(null);
  const [migrateToId, setMigrateToId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/accounts");
    const data = await res.json();
    if (data.code === 0) setAccounts(data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // 新增/编辑
  const openModal = (account?: AccountInfo) => {
    if (account) {
      setEditingId(account.id);
      form.setFieldsValue({ name: account.name, type: account.type });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const url = editingId ? `/api/accounts/${editingId}` : "/api/accounts";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.code === 0) {
        message.success(editingId ? "更新成功" : "创建成功");
        setModalOpen(false);
        fetchAccounts();
      } else {
        message.error(data.message);
      }
    } catch {
      message.error("操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 转账
  const handleTransfer = async (values: Record<string, unknown>) => {
    setTransferring(true);
    try {
      const res = await fetch("/api/accounts/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.code === 0) {
        message.success("转账成功");
        setTransferOpen(false);
        fetchAccounts();
      } else {
        message.error(data.message);
      }
    } catch {
      message.error("转账失败");
    } finally {
      setTransferring(false);
    }
  };

  // 删除
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const params = migrateToId
        ? `?migrateToId=${migrateToId}`
        : "";
      const res = await fetch(`/api/accounts/${deleteTarget.id}${params}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.code === 0) {
        message.success(data.message);
        setDeleteTarget(null);
        fetchAccounts();
      } else {
        message.error(data.message);
      }
    } catch {
      message.error("删除失败");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="!mb-0">账户管理</Title>
        <Space>
          <Button
            icon={<SwapOutlined />}
            onClick={() => {
              transferForm.resetFields();
              setTransferOpen(true);
            }}
            disabled={accounts.length < 2}
          >
            转账
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            新建账户
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {accounts.length === 0 && !loading && (
          <Col span={24}>
            <EmptyState
              title="暂无账户"
              description="创建账户来管理不同资金渠道"
              actionText="新建账户"
              onAction={() => openModal()}
            />
          </Col>
        )}
        {accounts.map((acc, index) => (
          <Col xs={24} sm={12} md={8} key={acc.id}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="!border-0 !shadow-sm hover:!shadow-md transition-shadow"
                styles={{ body: { padding: "24px" } }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Text strong className="text-lg">
                      {acc.name}
                    </Text>
                    <Tag
                      color={accountTypeColors[acc.type] ?? "default"}
                      className="ml-2"
                    >
                      {accountTypeLabels[acc.type] ?? acc.type}
                    </Tag>
                  </div>
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openModal(acc)}
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setDeleteTarget(acc)}
                    />
                  </Space>
                </div>
                <div className="text-2xl font-bold text-blue-500">
                  {formatCurrency(acc.balance)}
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* 编辑弹窗 */}
      <Modal
        title={editingId ? "编辑账户" : "新建账户"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingId ? "保存" : "创建"}
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="账户名称"
            rules={[{ required: true, message: "请输入账户名称" }]}
          >
            <Input maxLength={50} placeholder="如：招商银行储蓄卡" />
          </Form.Item>
          <Form.Item
            name="type"
            label="账户类型"
            rules={[{ required: true, message: "请选择类型" }]}
          >
            <Select
              options={[
                { value: "bank", label: "🏦 银行卡" },
                { value: "cash", label: "💵 现金" },
                { value: "credit", label: "💳 信用卡" },
                { value: "payment", label: "📱 支付软件" },
              ]}
            />
          </Form.Item>
          {!editingId && (
            <Form.Item name="initialBalance" label="初始余额（可选）">
              <InputNumber className="w-full" precision={2} prefix="¥" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 转账弹窗 */}
      <Modal
        title="账户转账"
        open={transferOpen}
        onCancel={() => setTransferOpen(false)}
        onOk={() => transferForm.submit()}
        confirmLoading={transferring}
        okText="确认转账"
        cancelText="取消"
      >
        <Form form={transferForm} layout="vertical" onFinish={handleTransfer}>
          <Form.Item
            name="fromAccountId"
            label="源账户"
            rules={[{ required: true, message: "请选择" }]}
          >
            <Select
              options={accounts.map((a) => ({
                value: a.id,
                label: `${a.name} (${a.balance})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="toAccountId"
            label="目标账户"
            rules={[{ required: true, message: "请选择" }]}
          >
            <Select
              options={accounts.map((a) => ({
                value: a.id,
                label: `${a.name} (${a.balance})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: "请输入金额" }]}
          >
            <InputNumber className="w-full" precision={2} prefix="¥" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input maxLength={200} placeholder="转账备注（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除确认 */}
      <Modal
        title="删除账户"
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onOk={handleDelete}
        confirmLoading={deleting}
        okButtonProps={{ danger: true }}
        okText="确认删除"
        cancelText="取消"
      >
        <p>确定删除账户「{deleteTarget?.name}」吗？</p>
        <Select
          placeholder="选择迁移目标账户"
          className="w-full mt-2"
          allowClear
          onChange={(val) => setMigrateToId(val)}
          options={accounts
            .filter((a) => a.id !== deleteTarget?.id)
            .map((a) => ({
              value: a.id,
              label: a.name,
            }))}
        />
      </Modal>
    </motion.div>
  );
}
