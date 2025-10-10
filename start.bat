@echo off
REM 组合产品订单系统 - Windows 快速启动脚本

echo ==================================
echo   订单管理系统 - 快速启动
echo ==================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: Node.js 未安装
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js 版本: %NODE_VERSION%

REM 安装后端依赖
echo.
echo 📦 安装后端依赖...
cd backend
if not exist "node_modules\" (
    call npm install
) else (
    echo ✅ 后端依赖已安装
)

REM 安装前端依赖
echo.
echo 📦 安装前端依赖...
cd ..\frontend
if not exist "node_modules\" (
    call npm install
) else (
    echo ✅ 前端依赖已安装
)

cd ..

REM 启动服务
echo.
echo ==================================
echo 🚀 启动服务...
echo ==================================
echo.
echo 后端: http://localhost:5001
echo 前端: http://localhost:3000
echo.
echo 将打开两个新窗口运行服务
echo 关闭窗口可停止对应服务
echo.
pause

REM 启动后端（新窗口）
start "订单系统-后端" cmd /k "cd backend && npm run dev"

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 启动前端（新窗口）
start "订单系统-前端" cmd /k "cd frontend && npm start"

echo.
echo ✅ 服务已启动
echo.
pause

