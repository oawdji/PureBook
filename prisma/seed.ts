import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const presetCategories = [
  { name: "餐饮", icon: "CoffeeOutlined", color: "#FF6B6B" },
  { name: "交通", icon: "CarOutlined", color: "#4ECDC4" },
  { name: "购物", icon: "ShoppingCartOutlined", color: "#FFD93D" },
  { name: "住房", icon: "HomeOutlined", color: "#6C5CE7" },
  { name: "娱乐", icon: "SmileOutlined", color: "#E056A0" },
  { name: "医疗", icon: "MedicineBoxOutlined", color: "#00B894" },
  { name: "工资", icon: "DollarOutlined", color: "#27AE60" },
  { name: "其他", icon: "EllipsisOutlined", color: "#95A5A6" },
  { name: "教育", icon: "ReadOutlined", color: "#3498DB" },
  { name: "通讯", icon: "PhoneOutlined", color: "#E67E22" },
];

async function main() {
  console.log("🌱 开始导入预设分类...\n");

  for (const category of presetCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, userId: null },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name: category.name,
          icon: category.icon,
          color: category.color,
          isPreset: true,
        },
      });
      console.log(`  ✓ ${category.name} (新增)`);
    } else {
      console.log(`  - ${category.name} (已存在，跳过)`);
    }
  }

  const count = await prisma.category.count({ where: { isPreset: true } });
  console.log(`\n✅ 预设分类导入完成！共 ${count} 个分类`);
}

main()
  .catch((e) => {
    console.error("❌ 种子数据导入失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
