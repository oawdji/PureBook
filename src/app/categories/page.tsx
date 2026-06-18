"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  Row,
  Col,
  Space,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import EmptyState from "@/components/ui/EmptyState";
import type { CategoryInfo } from "@/types";

const { Title, Text } = Typography;

const colorOptions = [
  "#FF6B6B", "#4ECDC4", "#FFD93D", "#6C5CE7",
  "#E056A0", "#00B894", "#27AE60", "#95A5A6",
  "#3498DB", "#E67E22", "#9B59B6", "#1ABC9C",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // 编辑弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const watchedColor: string | undefined = Form.useWatch("color", form);

  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<CategoryInfo | null>(null);
  const [migrateToId, setMigrateToId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (data.code === 0) setCategories(data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 打开新增/编辑弹窗
  const openModal = (category?: CategoryInfo) => {
    if (category) {
      setEditingId(category.id);
      form.setFieldsValue({
        name: category.name,
        color: category.color,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  // 提交
  const handleSubmit = async (values: Record<string, string>) => {
    setSubmitting(true);
    try {
      const url = editingId
        ? `/api/categories/${editingId}`
        : "/api/categories";
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
        fetchCategories();
      } else {
        message.error(data.message);
      }
    } catch {
      message.error("操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 删除
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/categories/${deleteTarget.id}?migrateToId=${migrateToId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.code === 0) {
        message.success(data.message);
        setDeleteTarget(null);
        fetchCategories();
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
        <Title level={4} className="!mb-0">
          分类管理
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
        >
          新建分类
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {(categories.length === 0 && !loading) && (
          <Col span={24}>
            <EmptyState
              title="暂无分类"
              description="创建自定义分类来更好地管理收支"
              actionText="新建分类"
              onAction={() => openModal()}
            />
          </Col>
        )}
        {categories.map((cat, index) => (
          <Col xs={24} sm={12} md={8} key={cat.id}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Card
                className="!border-0 !shadow-sm hover:!shadow-md transition-shadow"
                styles={{ body: { padding: "20px" } }}
              >
                <div className="flex items-center justify-between">
                  <Space>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.name.charAt(0)}
                    </div>
                    <div>
                      <Text strong>{cat.name}</Text>
                    </div>
                  </Space>
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openModal(cat)}
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setDeleteTarget(cat)}
                    />
                  </Space>
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* 编辑弹窗 */}
      <Modal
        title={editingId ? "编辑分类" : "新建分类"}
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
            label="名称"
            rules={[{ required: true, message: "请输入分类名称" }]}
          >
            <Input maxLength={30} placeholder="如：宠物、旅游" />
          </Form.Item>
          <Form.Item label="颜色" required>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {colorOptions.map((c) => (
                <div
                  key={c}
                  className="w-7 h-7 rounded-full cursor-pointer border-2 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: c,
                    borderColor:
                      watchedColor === c ? "#1677ff" : "#e5e5e5",
                  }}
                  onClick={() => form.setFieldValue("color", c)}
                />
              ))}
            </div>
            <Form.Item
              name="color"
              noStyle
              rules={[{ required: true, message: "请选择或输入颜色" }]}
            >
              <Input placeholder="或输入自定义 #HEX 颜色" maxLength={7} />
            </Form.Item>
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除确认 */}
      <Modal
        title="删除分类"
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onOk={handleDelete}
        confirmLoading={deleting}
        okButtonProps={{ danger: true }}
        okText="确认删除"
        cancelText="取消"
      >
        <p>
          确定删除分类「{deleteTarget?.name}」吗？下方记录将被迁移：
        </p>
        <Select
          placeholder="选择迁移目标分类"
          className="w-full mt-2"
          onChange={(val) => setMigrateToId(val)}
          options={categories
            .filter((c) => c.id !== deleteTarget?.id)
            .map((c) => ({
              value: c.id,
              label: c.name,
            }))}
        />
      </Modal>
    </motion.div>
  );
}
