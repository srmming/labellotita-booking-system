# 部署指南

## 部署架构

```
前端 (Vercel)  →  后端 (Railway)  →  MongoDB (Railway)
    ↓                  ↓                    ↓
  静态文件          Express API          云数据库
```

## 第一步：部署后端到 Railway

### 1.1 访问 Railway

1. 访问 [Railway](https://railway.app/)
2. 使用 GitHub 账号登录
3. 点击 "New Project"

### 1.2 从 GitHub 仓库部署

1. 选择 "Deploy from GitHub repo"
2. 选择仓库：`srmming/labellotita-booking-system`
3. Railway 会自动检测到 Node.js 项目

### 1.3 配置环境变量

在 Railway 项目的 Variables 面板添加：

```bash
# 数据库连接（使用 Railway MongoDB）
MONGODB_URI=mongodb://mongo:ZlXZvzMETjiHNMqvmFVsVlPiXTJmPlfK@crossover.proxy.rlwy.net:56589/order-system?authSource=admin

# 或者使用内部连接（如果后端和 MongoDB 都在 Railway）
# MONGODB_URI=mongodb://mongo:ZlXZvzMETjiHNMqvmFVsVlPiXTJmPlfK@mongodb.railway.internal:27017/order-system?authSource=admin

# 环境配置
NODE_ENV=production
PORT=5001

# CORS 配置（前端域名，部署后更新）
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 1.4 等待部署完成

- Railway 会自动构建并部署
- 部署成功后，会得到一个公网 URL，例如：`https://labellotita-backend-production.up.railway.app`
- 记录这个 URL，前端需要用到

### 1.5 验证后端部署

访问以下 URL 验证：

```bash
# 健康检查
https://your-backend-domain.up.railway.app/health

# 获取客户列表
https://your-backend-domain.up.railway.app/api/customers

# 获取产品列表
https://your-backend-domain.up.railway.app/api/products
```

## 第二步：配置 CORS

更新 `backend/server.js` 的 CORS 配置：

```javascript
// 当前配置（允许所有来源）
app.use(cors());

// 生产环境配置（推荐）
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

## 第三步：部署前端到 Vercel

### 3.1 访问 Vercel

1. 访问 [Vercel](https://vercel.com/)
2. 使用 GitHub 账号登录
3. 点击 "Add New Project"

### 3.2 导入 GitHub 仓库

1. 选择仓库：`srmming/labellotita-booking-system`
2. 配置项目：
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3.3 配置环境变量

在 Vercel 项目设置中添加环境变量：

```bash
REACT_APP_API_URL=https://your-backend-domain.up.railway.app/api
```

**重要**：替换 `your-backend-domain` 为实际的 Railway 后端域名

### 3.4 部署

1. 点击 "Deploy"
2. 等待部署完成（约 1-2 分钟）
3. 部署成功后，会得到前端 URL，例如：`https://labellotita-booking-system.vercel.app`

### 3.5 更新后端 CORS 配置

回到 Railway，更新环境变量：

```bash
FRONTEND_URL=https://labellotita-booking-system.vercel.app
```

Railway 会自动重新部署。

## 第四步：验证部署

### 4.1 访问前端

打开前端 URL：`https://labellotita-booking-system.vercel.app`

### 4.2 测试功能

1. 查看仪表板
2. 浏览客户列表
3. 查看产品列表
4. 创建测试订单
5. 检查发货功能

### 4.3 检查控制台

打开浏览器开发者工具（F12），确保没有：
- CORS 错误
- API 请求失败
- 网络错误

## 常见问题

### Q1: Railway 部署失败

**检查**：
- `nixpacks.toml` 配置是否正确
- `backend/package.json` 的 `start` 脚本是否正确
- 环境变量是否设置

**解决**：
1. 查看 Railway 部署日志
2. 确保 Node.js 版本兼容（使用 Node 18 或 20）
3. 检查端口配置（Railway 自动分配端口，使用 `process.env.PORT`）

### Q2: 前端无法连接后端

**检查**：
- `REACT_APP_API_URL` 是否正确
- 后端 CORS 是否配置
- 后端是否正常运行

**解决**：
1. 在浏览器控制台查看网络请求
2. 确认后端 URL 可访问
3. 检查 CORS 配置

### Q3: 数据库连接失败

**检查**：
- `MONGODB_URI` 是否正确
- 是否添加了 `authSource=admin`
- Railway MongoDB 是否运行

**解决**：
1. 在 Railway 日志中查看错误
2. 测试数据库连接
3. 确认连接字符串格式

### Q4: Vercel 构建失败

**检查**：
- Root Directory 是否设置为 `frontend`
- `frontend/package.json` 是否有 `build` 脚本
- Node.js 版本是否兼容

**解决**：
1. 查看 Vercel 构建日志
2. 确保所有依赖已安装
3. 检查构建命令

## 环境变量总结

### Railway 后端

```bash
MONGODB_URI=mongodb://mongo:ZlXZvzMETjiHNMqvmFVsVlPiXTJmPlfK@crossover.proxy.rlwy.net:56589/order-system?authSource=admin
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://labellotita-booking-system.vercel.app
```

### Vercel 前端

```bash
REACT_APP_API_URL=https://your-backend-domain.up.railway.app/api
```

## 持续部署

### 自动部署

- **Railway**: 每次推送到 `main` 分支，自动重新部署后端
- **Vercel**: 每次推送到 `main` 分支，自动重新部署前端

### 手动部署

**Railway**:
1. 进入项目
2. 点击 "Deployments"
3. 点击 "Deploy"

**Vercel**:
1. 进入项目
2. 点击 "Deployments"
3. 点击 "Redeploy"

## 监控和日志

### Railway

1. 进入项目
2. 点击 "Deployments" 查看部署历史
3. 点击 "Logs" 查看实时日志
4. 点击 "Metrics" 查看性能指标

### Vercel

1. 进入项目
2. 点击 "Deployments" 查看部署历史
3. 点击具体部署查看构建日志
4. 点击 "Analytics" 查看访问统计（Pro 功能）

## 成本估算

### 免费套餐

- **Railway**: 
  - $5/月免费额度
  - 约 500 小时运行时间
  - 适合低流量项目
  
- **Vercel**: 
  - 100GB 带宽/月
  - 无限部署
  - 适合个人项目

- **MongoDB (Railway)**:
  - 包含在 Railway 免费额度内
  - 1GB 存储

### 付费升级

当免费额度不够时：
- **Railway**: $5/月起，按使用量计费
- **Vercel Pro**: $20/月
- **MongoDB Atlas**: $9/月起（512MB）

## 下一步优化

1. **添加域名**: 绑定自定义域名
2. **HTTPS**: 自动配置（Railway 和 Vercel 已提供）
3. **CDN**: Vercel 自动提供 CDN
4. **缓存**: 优化 API 响应缓存
5. **监控**: 添加错误追踪（如 Sentry）
6. **备份**: 定期备份 MongoDB 数据

