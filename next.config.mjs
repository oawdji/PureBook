/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "antd",
    "@ant-design/icons",
    "@ant-design/nextjs-registry",
    "rc-util",
    "rc-pagination",
    "rc-picker",
    "rc-input",
    "rc-tree",
    "rc-table",
    "@react-spring/web",
  ],
};

export default nextConfig;
