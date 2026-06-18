import type { ThemeConfig } from "antd";

const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: "#1677ff",
    borderRadius: 8,
    colorBgContainer: "#ffffff",
    colorBgLayout: "#f5f5f5",
    fontFamily: "var(--font-geist-sans), sans-serif",
  },
  components: {
    Card: {
      borderRadiusLG: 12,
    },
    Table: {
      borderRadiusLG: 12,
    },
    Button: {
      borderRadius: 8,
    },
  },
};

export default lightTheme;
