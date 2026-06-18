"use client";

import { Modal } from "antd";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  content: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
}

export default function ConfirmModal({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  loading = false,
  danger = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={loading}
      okButtonProps={{ danger }}
      okText="确认"
      cancelText="取消"
      centered
    >
      <p className="text-gray-600">{content}</p>
    </Modal>
  );
}
