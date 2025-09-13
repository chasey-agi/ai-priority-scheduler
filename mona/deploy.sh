#!/bin/bash

# AI Priority Scheduler 部署脚本

echo "🚀 开始部署 AI Priority Scheduler..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装，正在安装..."
    npm install -g vercel
fi

# 检查环境变量文件
if [ ! -f ".env.local" ]; then
    echo "⚠️  警告: .env.local 文件不存在"
    echo "请确保已配置以下环境变量:"
    echo "- OPENAI_API_KEY"
    echo "- NEXT_PUBLIC_SUPABASE_URL"
    echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "- SUPABASE_SERVICE_ROLE_KEY"

    echo "- NEXTAUTH_SECRET"
    echo "- NEXTAUTH_URL"
    echo ""
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 部署到 Vercel
echo "🌐 部署到 Vercel..."
vercel --prod

echo "✅ 部署完成！"
echo "📝 请确保在 Vercel 控制台中配置了所有必要的环境变量"
echo "🔗 访问 https://vercel.com/dashboard 查看部署状态"