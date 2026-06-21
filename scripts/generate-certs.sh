#!/bin/bash
# ============================================================
# PureBook - 自签名 SSL 证书生成脚本
# 适用于无域名、无 CA 证书的服务器部署场景
# 生成 10 年有效期的 RSA 2048 位证书
# ============================================================

set -e

CERT_DIR="docker/certs"
CERT_FILE="${CERT_DIR}/server.crt"
KEY_FILE="${CERT_DIR}/server.key"

echo "[PureBook] 正在生成自签名 SSL 证书..."

mkdir -p "${CERT_DIR}"

# 生成自签名证书
# -x509: 自签名证书格式
# -nodes: 不加密私钥（避免 Nginx 启动时需要密码）
# -days 3650: 有效期 10 年
# -newkey rsa:2048: 2048 位 RSA 密钥
# -subj: 证书主题，/CN=localhost 适配 IP 访问
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout "${KEY_FILE}" \
  -out "${CERT_FILE}" \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=PureBook/CN=localhost" \
  -addext "subjectAltName=IP:127.0.0.1"

echo "[PureBook] 证书生成完成！"
echo "  证书: ${CERT_FILE}"
echo "  私钥: ${KEY_FILE}"
echo "  有效期: 10 年"
echo ""
echo "现在可以运行: docker compose up -d --build"
