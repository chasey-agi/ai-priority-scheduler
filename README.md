# ai-priority-scheduler

> 一款基于语音交互的 AI 任务管家，支持语音输入、任务智能分类、优先级排序、每日总结与播报，以及执行力可视化分析。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fchasey-agi%2Fai-priority-scheduler&env=OPENAI_API_KEY,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL&envDescription=%E8%AF%B7%E5%A1%AB%E5%86%99%20OpenAI%20API%20Key%E3%80%81Supabase%20URL%20%2F%20Anon%20Key%E3%80%81Service%20Role%20Key%E3%80%81%E6%95%B0%E6%8D%AE%E5%BA%93%20DATABASE_URL%E3%80%81NextAuth%20Secret%20%E5%8F%8A%20NextAuth%20URL%EF%BC%88%E7%94%9F%E4%BA%A7%E5%9F%9F%E5%90%8D%EF%BC%89&envLink=https%3A%2F%2Fgithub.com%2Fchasey-agi%2Fai-priority-scheduler%2Fblob%2Fmain%2Fmona%2FSUPABASE_SETUP.md)

- 在线一键部署：点击上方按钮，完成 Git 授权并填写环境变量后即可自动构建部署。
- Monorepo 说明：本仓库使用根级 vercel.json，已在 install/build/dev 命令中进入 mona 子目录，无需在 Vercel 设置里修改 Root Directory。

目录
- 项目概述与背景
- 功能特性
- 架构与技术栈
- 安装与快速开始（本地 / 云端）
- 使用指南（示例与截图位）
- API 简要参考
- 故障排查与常见问题
- 贡献与开发

项目概述与背景
- 背景：个人与团队在繁忙的日程下，常常需要快速记录想法、按优先级组织任务，并通过可视化了解执行情况。
- 目标：提供“语音即输入、AI 即助理”的体验，降低记录成本，自动完成分类与优先级判断，并为每天的推进情况生成摘要与可视化分析。

功能特性
- 语音转写：通过 /api/transcribe 实现语音 → 文本。
- 智能任务：
  - 任务创建：支持内容、类别、优先级、截止日期等字段
  - 优先级映射与校验：支持字符串/数值两种输入，内部统一为可比对的等级
  - 批量操作：批量完成、删除、置优先级、置状态
- 数据可视化与分析：提供任务完成率、优先级分布等图表（基于 Recharts）。
- 认证与会话：集成 Supabase Auth（OAuth 登录），配合服务端鉴权。
- App Router API：任务相关 REST 风格 API（GET/POST/PATCH/DELETE）。

架构与技术栈
- 前端：Next.js 15（App Router）+ React 19 + Tailwind CSS 4 + shadcn/ui（Radix UI）
- 后端：Next.js Route Handlers（Node 运行时）
- 数据：Supabase（Postgres + Auth）
- AI：OpenAI SDK（语音与文本处理）
- 可视化：Recharts
- 目录结构：应用代码位于 mona 子目录（例如 app、components、lib 等）

安装与快速开始
本地开发
1) 环境准备
- Node.js 20+（建议 LTS）
- npm 或 pnpm（示例命令使用 npm）

2) 克隆与安装
- git clone <你的仓库> && cd ai-priority-scheduler
- cd mona && npm install

3) 环境变量（创建 mona/.env.local）
- 必填键：
  - OPENAI_API_KEY
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY（仅服务端使用）
  - DATABASE_URL（如使用数据库直连）
  - NEXTAUTH_SECRET（可通过 openssl rand -base64 32 生成）
  - NEXTAUTH_URL（本地可设 http://localhost:3000）
- Supabase 初始化与表结构：参见 mona/SUPABASE_SETUP.md

4) 运行
- 在 mona 目录执行：npm run dev
- 打开 http://localhost:3000

云端部署（Vercel）
- 推荐：点击本文顶端“一键部署”按钮完成部署
- 项目将根据根级 vercel.json 自动进入 mona 子目录安装与构建
- 在 Vercel 项目设置中，按环境分别填写上述环境变量

使用指南
- 登录/认证：首次访问会引导登录（Supabase OAuth）。
- 创建任务：在任务页输入内容与可选字段（类别/优先级/截止日期），提交后实时可见。
- 批量操作：在任务列表中多选后，执行批量完成/删除/修改优先级/状态等。
- 分析页（Analytics）：查看任务完成趋势与分布情况。

示例代码片段
- 创建任务（客户端 fetch 示例）：

```ts
await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: '撰写周报',
    category: '工作',
    priority: 'high',       // 支持 'low'|'medium'|'high'|'urgent' 或数值等级
    deadline: '2025-10-01',
    status: 'pending'
  })
})
```

- 批量设置已完成：

```ts
await fetch('/api/tasks/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'complete', ids: ['id1','id2'] })
})
```

- 获取今日任务：

```ts
const res = await fetch('/api/tasks/today');
const data = await res.json();
```

API 简要参考
- POST /api/transcribe → 语音转写
- GET /api/tasks → 获取当前用户任务列表
- POST /api/tasks → 创建任务
- PATCH /api/tasks/[id] → 更新任务内容/状态/优先级/截止日期
- DELETE /api/tasks/[id] → 删除任务
- POST /api/tasks/batch → 批量操作（complete/delete/setPriority/setStatus）
- GET /api/tasks/today → 今日任务

截图与演示
- 建议将截图放在 mona/public/screenshots 目录，并在此处引用：
  - ![任务列表](mona/public/screenshots/tasks.png)
  - ![分析页](mona/public/screenshots/analytics.png)
- 也可录制一段 30–60s 的动图（GIF）展示“语音 → 任务 → 分析”的完整流程。

故障排查与常见问题（FAQ）
- 401 未授权：请确认已登录，且后端能正确获取 Supabase 用户信息。
- 环境变量缺失：若构建/运行报错，请核对 README 开头与 mona/SUPABASE_SETUP.md 中的变量是否已配置。
- 部署地区与数据库：如与数据库不在同一区域，可在 vercel.json 调整 regions 以降低延迟。

贡献与开发
- 代码风格：ESLint + TypeScript
- UI 规范：Tailwind CSS + shadcn/ui 组件
- 开发命令：
  - npm run dev：本地开发（Turbopack）
  - npm run build：构建
  - npm run start：启动生产构建
- 欢迎提交 Issue / PR，一起完善功能与体验。
