import type { ThemeConfig } from "antd";

const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: "#4096ff",
    borderRadius: 8,
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

export default darkTheme;
