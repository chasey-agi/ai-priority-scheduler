# 部署说明（Deployment）

本项目支持 Vercel 一键部署、Docker、自托管等方式。以下仅保留运行所必需的环境变量，并将高级可选项单独标注，降低部署门槛。

## 必填环境变量（当前代码实际使用）
- OPENAI_API_KEY
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## 可选环境变量（按需启用的高级能力）
- SUPABASE_SERVICE_ROLE_KEY：仅服务端管理操作（如批量迁移、RLS 维护、服务端脚本）需要；当前代码未引用
- DATABASE_URL：仅当你使用 Prisma 或直连数据库时需要；当前代码未引用
- NEXTAUTH_SECRET、NEXTAUTH_URL：仅当你切换到 NextAuth 方案时需要；当前代码未引用

## Vercel 部署
- 推荐使用根 README 顶部的“一键部署”按钮，Vercel 将自动读取 vercel.json 并在 mona 子目录安装/构建。
- 在 Vercel 项目 Settings → Environment Variables 中配置上述必填变量，可选变量按需添加。

## Docker 部署
示例 Dockerfile 见仓库根目录。构建与运行示例：

```bash
docker build -t ai-priority-scheduler .
# 将必填变量通过 -e 传入
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=... \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  ai-priority-scheduler
```

## 自托管/其他平台
- 按平台方式提供环境变量注入能力，确保三项必填变量已配置；可选项按需添加。

## 故障排查
- 401/403：通常为未登录或 Supabase Auth 配置问题，检查 OAuth 设置与回调域。
- 500：检查 OPENAI_API_KEY、Supabase URL/Anon Key 是否有效、是否误填到 Server/Client 作用域。
- 构建失败：本仓库使用根 vercel.json 指向 mona 子目录，请勿修改 Root Directory。