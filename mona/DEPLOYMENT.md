# AI Priority Scheduler 部署指南

本项目支持多种部署方式，推荐使用 Vercel 进行部署。

## 🚀 快速部署（推荐）

### 使用 Vercel 部署

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **配置环境变量**
   
   复制 `.env.example` 到 `.env.local` 并填入实际值：
   ```bash
   cp .env.example .env.local
   ```
   
   需要配置的环境变量：
   - `OPENAI_API_KEY`: OpenAI API 密钥
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名密钥
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase 服务角色密钥
   - `DATABASE_URL`: PostgreSQL 数据库连接字符串
   - `NEXTAUTH_SECRET`: NextAuth 密钥（生成命令：`openssl rand -base64 32`）
   - `NEXTAUTH_URL`: 部署后的域名（如：`https://your-app.vercel.app`）

3. **运行部署脚本**
   ```bash
   ./deploy.sh
   ```

### 手动部署步骤

1. **安装依赖**
   ```bash
   npm install
   ```

2. **生成 Prisma 客户端**
   ```bash
   npx prisma generate
   ```

3. **运行数据库迁移**
   ```bash
   npx prisma migrate deploy
   ```

4. **构建项目**
   ```bash
   npm run build
   ```

5. **部署到 Vercel**
   ```bash
   vercel --prod
   ```

## 🔧 其他部署选项

### Docker 部署

创建 `Dockerfile`：
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

构建和运行：
```bash
docker build -t ai-priority-scheduler .
docker run -p 3000:3000 --env-file .env.local ai-priority-scheduler
```

### 自托管部署

1. 在服务器上克隆项目
2. 安装 Node.js 18+ 和 npm
3. 按照手动部署步骤操作
4. 使用 PM2 或类似工具管理进程：
   ```bash
   npm install -g pm2
   pm2 start npm --name "ai-scheduler" -- start
   ```

## 📋 部署检查清单

- [ ] 配置所有必要的环境变量
- [ ] 确保 Supabase 数据库可访问
- [ ] 验证 OpenAI API 密钥有效
- [ ] 设置正确的 NEXTAUTH_URL
- [ ] 运行数据库迁移
- [ ] 测试 Google OAuth 登录
- [ ] 验证任务创建和管理功能

## 🔍 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `DATABASE_URL` 是否正确
   - 确保 Supabase 项目处于活跃状态

2. **OAuth 登录失败**
   - 验证 Google OAuth 配置
   - 检查 `NEXTAUTH_URL` 是否与实际域名匹配

3. **构建失败**
   - 确保所有依赖已安装
   - 检查 TypeScript 类型错误

4. **API 调用失败**
   - 验证 `OPENAI_API_KEY` 是否有效
   - 检查 API 配额和限制

### 日志查看

- **Vercel**: 在 Vercel 控制台查看函数日志
- **本地**: 使用 `npm run dev` 查看开发日志
- **生产**: 配置日志聚合服务（如 LogRocket、Sentry）

## 🔒 安全注意事项

1. 不要在代码中硬编码敏感信息
2. 使用强密码生成 `NEXTAUTH_SECRET`
3. 定期轮换 API 密钥
4. 启用 Supabase RLS（行级安全）
5. 配置适当的 CORS 设置

## 📈 性能优化

1. 启用 Next.js 图片优化
2. 配置 CDN（Vercel 自动提供）
3. 使用数据库连接池
4. 实施缓存策略
5. 监控应用性能

---

部署完成后，访问您的应用并测试所有功能是否正常工作。如有问题，请参考故障排除部分或查看项目文档。