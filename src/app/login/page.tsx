"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Tabs,
  message,
} from "antd";
import { UserOutlined, LockOutlined, WalletOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (values: {
    username: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const endpoint =
        activeTab === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (data.code === 0) {
        message.success(data.message);
        router.push("/");
        router.refresh();
      } else {
        message.error(data.message);
      }
    } catch {
      message.error("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card
          className="w-[400px] shadow-xl border-0"
          styles={{ body: { padding: "32px" } }}
        >
          {/* Logo */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-3">
                <WalletOutlined className="text-3xl text-white" />
              </div>
            </motion.div>
            <Title level={3} className="!mb-1">
              PureBook
            </Title>
            <Text type="secondary">个人记账 · 简单优雅</Text>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as "login" | "register")}
            centered
            size="large"
            items={[
              { key: "login", label: "登录" },
              { key: "register", label: "注册" },
            ]}
          />

          <Form
            onFinish={handleSubmit}
            size="large"
            autoComplete="off"
            initialValues={{ username: "", password: "" }}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "请输入用户名" },
                { min: 3, message: "用户名至少 3 个字符" },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="用户名"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "请输入密码" },
                { min: 6, message: "密码至少 6 个字符" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item className="!mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="h-11 text-base font-medium"
              >
                {activeTab === "login" ? "登录" : "注册"}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </motion.div>
    </div>
  );
}
