# Supabase 设置与初始化（Setup）

本文档帮助你在 Supabase 上完成最小可用配置，以便本项目正常运行。注意：以下带“可选”标记的内容为扩展能力，当前代码未引用，可跳过。

## 1. 创建 Supabase 项目
- 访问 https://supabase.com 并创建新项目，记录 Project URL 与 anon key。

## 2. 配置 OAuth（Google 等）
- 在 Authentication → Providers 启用 Google，并配置回调地址（本地开发 http://localhost:3000）。

## 3. 环境变量
- 必填（当前代码实际使用）：
  - OPENAI_API_KEY
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
- 可选（扩展能力，当前代码未用）：
  - SUPABASE_SERVICE_ROLE_KEY
  - DATABASE_URL
  - NEXTAUTH_SECRET、NEXTAUTH_URL

示例（.env.local）：
```
OPENAI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# 可选：以下在当前代码中未引用
# SUPABASE_SERVICE_ROLE_KEY=...
# DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
# NEXTAUTH_SECRET=...
# NEXTAUTH_URL=http://localhost:3000
```

## 4. 数据库表与 RLS
- 使用 Supabase SQL Editor 或迁移工具创建 tasks 等表，并开启 RLS（行级安全）。
- 提示：本项目主要通过 Supabase JS 客户端访问数据，不依赖服务端直连。

## 5. 本地开发与验证
- 在 mona 目录执行：npm run dev
- 打开 http://localhost:3000 验证登录与任务功能

## 6. 更新 Prisma 配置（可选，当前代码未用）
- 若你计划改为 Prisma/直连数据库，请在 schema.prisma 中配置对应 provider，并执行：
```
npx prisma generate
```
- 同时在 .env.local 配置 DATABASE_URL。

## 7. 常见问题排查
1. 登录失败：检查 OAuth Provider 回调与域名是否匹配。
2. 数据库连接错误（可选路径）：如走 Prisma/直连，验证 DATABASE_URL 格式和密码。
3. 生产环境登录回调：如使用 NextAuth（可选路径），确保 NEXTAUTH_URL 指向生产域名。

## 8. 安全提示
- 不要在前端代码中暴露 service role key。
- 使用 RLS 与 Policies 保证数据隔离。
- 如启用服务端直连或 NextAuth，务必将相应变量存储在 Server 端作用域。