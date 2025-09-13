import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 清除现有数据
  await prisma.task.deleteMany()
  await prisma.profile.deleteMany()

  // 创建示例用户
  const user = await prisma.profile.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'demo@example.com',
      fullName: '演示用户',
    },
  })

  // 创建示例任务
  const tasks = [
    {
      content: '完成项目文档编写',
      category: '工作',
      priority: '3',
      status: 'pending',
      deadline: new Date('2024-01-15'),
      userId: user.id,
    },
    {
      content: '准备周会汇报材料',
      category: '工作',
      priority: '2',
      status: 'pending',
      deadline: new Date('2024-01-14'),
      userId: user.id,
    },
    {
      content: '学习新技术栈',
      category: '学习',
      priority: '1',
      status: 'pending',
      deadline: null,
      userId: user.id,
    },
    {
      content: '健身锻炼',
      category: '健康',
      priority: '2',
      status: 'pending',
      deadline: new Date(),
      userId: user.id,
    },
    {
      content: '阅读技术书籍',
      category: '学习',
      priority: '1',
      status: 'pending',
      deadline: new Date('2024-01-16'),
      userId: user.id,
    },
    {
      content: '代码重构优化',
      category: '工作',
      priority: '3',
      status: 'completed',
      deadline: new Date('2024-01-12'),
      completedAt: new Date('2024-01-12'),
      userId: user.id,
    },
    {
      content: '团队建设活动',
      category: '工作',
      priority: '1',
      status: 'pending',
      deadline: new Date('2024-01-20'),
      userId: user.id,
    },
    {
      content: '购买生活用品',
      category: '生活',
      priority: '1',
      status: 'pending',
      deadline: new Date(),
      userId: user.id,
    },
  ]

  for (const task of tasks) {
    await prisma.task.create({
      data: task,
    })
  }

  console.log('数据库种子数据已创建')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })