# Supabase 设置指南

本指南将帮助您完成 Supabase 数据库和认证系统的配置。

## 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并登录
2. 点击 "New Project" 创建新项目
3. 选择组织，输入项目名称（如：ai-priority-scheduler）
4. 设置数据库密码（请记住此密码）
5. 选择地区（建议选择离您最近的地区）
6. 点击 "Create new project"

## 2. 获取项目配置信息

项目创建完成后，在项目仪表板中：

1. 进入 **Settings** > **API**
2. 复制以下信息：
   - **Project URL**：`https://your-project-ref.supabase.co`
   - **anon public key**：`eyJ...`（用于客户端）
   - **service_role secret**：`eyJ...`（用于服务端，请保密）

## 3. 配置环境变量

1. 复制 `.env.example` 文件为 `.env.local`：
   ```bash
   cp .env.example .env.local
   ```

2. 编辑 `.env.local` 文件，填入您的 Supabase 配置：
   ```env
   # OpenAI API Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Database Configuration (Supabase PostgreSQL)
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   
   # Next.js Configuration
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

## 4. 运行数据库迁移

1. 在 Supabase 仪表板中，进入 **SQL Editor**
2. 创建新查询，复制 `supabase/migrations/001_initial_schema.sql` 文件的内容
3. 执行 SQL 脚本以创建数据表和设置 RLS 策略

或者使用 Supabase CLI：
```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录 Supabase
supabase login

# 链接到您的项目
supabase link --project-ref your-project-ref

# 运行迁移
supabase db push
```

## 5. 配置 Google OAuth

1. 在 Supabase 仪表板中，进入 **Authentication** > **Providers**
2. 找到 **Google** 提供商并点击配置
3. 启用 Google 提供商
4. 前往 [Google Cloud Console](https://console.cloud.google.com/)
5. 创建新项目或选择现有项目
6. 启用 Google+ API
7. 创建 OAuth 2.0 客户端 ID：
   - 应用类型：Web 应用程序
   - 授权重定向 URI：`https://your-project-ref.supabase.co/auth/v1/callback`
8. 复制客户端 ID 和客户端密钥到 Supabase 的 Google 配置中
9. 保存配置

## 6. 更新 Prisma 配置

运行以下命令生成 Prisma 客户端：
```bash
npx prisma generate
```

## 7. 测试配置

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问 `http://localhost:3000`
3. 您应该会被重定向到登录页面
4. 点击 "Continue with Google" 测试 Google 登录
5. 登录成功后应该重定向到任务管理页面

## 8. 验证数据库连接

登录后，尝试：
- 创建新任务
- 编辑任务
- 删除任务
- 查看任务列表

所有操作都应该正常工作，数据会保存到 Supabase 数据库中。

## 故障排除

### 常见问题

1. **认证错误**：检查 Google OAuth 配置和重定向 URI
2. **数据库连接错误**：验证 DATABASE_URL 格式和密码
3. **API 错误**：检查 Supabase URL 和 API 密钥

### 调试步骤

1. 检查浏览器控制台的错误信息
2. 查看 Supabase 仪表板的日志
3. 验证环境变量是否正确设置
4. 确认数据库迁移已成功执行

## 安全注意事项

1. **永远不要**将 `service_role` 密钥暴露给客户端
2. 确保 `.env.local` 文件不被提交到版本控制
3. 定期轮换 API 密钥
4. 在生产环境中使用强密码

## 生产部署

部署到生产环境时：

1. 更新 Google OAuth 重定向 URI 为生产域名
2. 设置生产环境的环境变量
3. 确保 NEXTAUTH_URL 指向生产域名
4. 考虑启用 Supabase 的额外安全功能

完成以上步骤后，您的应用就可以使用 Supabase 作为数据库和认证系统了！