"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  message,
} from "antd";
import dayjs from "dayjs";
import type {
  CategoryInfo,
  AccountInfo,
  TransactionInfo,
} from "@/types";

interface TransactionDrawerProps {
  open: boolean;
  editingId: number | null;
  categories: CategoryInfo[];
  accounts: AccountInfo[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionDrawer({
  open,
  editingId,
  categories,
  accounts,
  onClose,
  onSuccess,
}: TransactionDrawerProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const isEdit = editingId !== null;

  // 加载编辑数据
  useEffect(() => {
    if (open && editingId) {
      fetch(`/api/transactions/${editingId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.code === 0) {
            const t = data.data as TransactionInfo;
            form.setFieldsValue({
              type: t.type,
              amount: parseFloat(t.amount),
              categoryId: t.category.id,
              accountId: t.account.id,
              transDate: dayjs(t.transDate),
              note: t.note ?? "",
            });
          }
        });
    } else {
      form.resetFields();
      form.setFieldsValue({ type: "expense", transDate: dayjs() });
    }
  }, [open, editingId, form]);

  // 提交
  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    const body = {
      ...values,
      transDate: values.transDate
        ? (values.transDate as dayjs.Dayjs).format("YYYY-MM-DD")
        : undefined,
    };

    try {
      const url = isEdit
        ? `/api/transactions/${editingId}`
        : "/api/transactions";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.code === 0) {
        message.success(isEdit ? "更新成功" : "创建成功");
        onSuccess();
      } else {
        message.error(data.message);
      }
    } catch {
      message.error("操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={isEdit ? "编辑记录" : "记一笔"}
      open={open}
      onClose={onClose}
      width={420}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={() => form.submit()}
          >
            {isEdit ? "保存" : "添加"}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ type: "expense", transDate: dayjs() }}
      >
        <Form.Item
          name="type"
          label="类型"
          rules={[{ required: true, message: "请选择类型" }]}
        >
          <Select
            options={[
              { value: "expense", label: "💰 支出" },
              { value: "income", label: "💵 收入" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="amount"
          label="金额"
          rules={[
            { required: true, message: "请输入金额" },
            { type: "number", min: 0.01, message: "金额必须大于 0" },
          ]}
        >
          <InputNumber
            className="w-full"
            prefix="¥"
            precision={2}
            placeholder="0.00"
          />
        </Form.Item>

        <Form.Item
          name="categoryId"
          label="分类"
          rules={[{ required: true, message: "请选择分类" }]}
        >
          <Select
            placeholder="选择分类"
            options={categories.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="accountId"
          label="账户"
          rules={[{ required: true, message: "请选择账户" }]}
        >
          <Select
            placeholder="选择账户"
            options={accounts.map((a) => ({
              value: a.id,
              label: `${a.name} (${a.balance})`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="transDate"
          label="日期"
          rules={[{ required: true, message: "请选择日期" }]}
        >
          <DatePicker className="w-full" />
        </Form.Item>

        <Form.Item name="note" label="备注">
          <Input.TextArea maxLength={200} rows={2} placeholder="备注（可选）" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
