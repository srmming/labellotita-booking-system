#!/bin/bash

# 组合产品订单系统 - 快速启动脚本

echo "=================================="
echo "  订单管理系统 - 快速启动"
echo "=================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查 MongoDB
if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    echo "⚠️  警告: MongoDB 客户端未找到"
    echo "请确保 MongoDB 已安装并运行"
    echo ""
fi

# 安装后端依赖
echo ""
echo "📦 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ 后端依赖已安装"
fi

# 安装前端依赖
echo ""
echo "📦 安装前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ 前端依赖已安装"
fi

cd ..

# 启动服务
echo ""
echo "=================================="
echo "🚀 启动服务..."
echo "=================================="
echo ""
echo "后端: http://localhost:5001"
echo "前端: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 使用 trap 捕获退出信号，清理后台进程
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# 启动后端（后台运行）
cd backend
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端
cd ../frontend
npm start

# 等待所有后台进程
wait

