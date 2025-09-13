/*
  Seed sample tasks to validate end-to-end features.
  Usage: node scripts/seed.js
*/
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function atStartOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

async function main() {
  console.log("Seeding tasks...");
  await prisma.task.deleteMany({});

  const now = new Date();
  const today = atStartOfDay(now);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const tasks = [
    {
      content: "提交项目周报\n整理本周工作亮点与下周计划",
      category: "工作",
      priority: 5,
      status: "pending",
      deadline: today,
    },
    {
      content: "健身 45 分钟",
      category: "生活",
      priority: 1,
      status: "pending",
      deadline: null,
    },
    {
      content: "阅读课程笔记\n第 3 章并做摘记",
      category: "学习",
      priority: 3,
      status: "pending",
      deadline: tomorrow,
    },
    {
      content: "代码评审两条 PR",
      category: "工作",
      priority: 4,
      status: "completed",
      deadline: today,
    },
    {
      content: "与产品同步需求变更",
      category: "工作",
      priority: 3,
      status: "pending",
      deadline: today,
    },
    {
      content: "购买日用品",
      category: "生活",
      priority: 1,
      status: "pending",
      deadline: tomorrow,
    },
  ];

  await prisma.task.createMany({ data: tasks });
  console.log("Seed completed: ", tasks.length, "tasks inserted.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });