# 安装指南

## 快速安装

### 1. 安装 MongoDB

#### macOS (使用 Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Windows
下载并安装：https://www.mongodb.com/try/download/community

#### Linux (Ubuntu)
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### 2. 验证 MongoDB
```bash
mongosh
# 看到 MongoDB shell 提示符即成功
```

### 3. 安装项目依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 4. 启动项目

**开启两个终端窗口：**

**终端 1 - 后端：**
```bash
cd backend
npm run dev
```
看到 `MongoDB connected successfully` 和 `Server running on port 5000` 即成功

**终端 2 - 前端：**
```bash
cd frontend
npm start
```
浏览器会自动打开 http://localhost:3000

## 测试数据初始化

首次使用建议通过界面手动创建测试数据：

### 1. 创建客户
- 导航到「客户管理」
- 点击「新增客户」
- 填写：姓名、电话、邮箱

### 2. 创建基础产品
- 导航到「产品管理」
- 点击「新增产品」
- 创建几个基础产品：
  ```
  蜡烛 (基础产品, 库存: 100)
  香薰 (基础产品, 库存: 50)
  包装盒 (基础产品, 库存: 80)
  ```

### 3. 创建组合产品
- 点击「新增产品」
- 选择「组合产品」
- 添加组件：
  ```
  节日礼品套装:
    - 蜡烛 x 2
    - 香薰 x 1
    - 包装盒 x 1
  ```

### 4. 创建订单
- 导航到「订单管理」
- 点击「新建订单」
- 选择客户、产品、数量

### 5. 测试出货
- 点击订单详情
- 点击「新增出货」
- 选择产品和出货数量
- 观察库存自动扣减

## 常见问题

### Q: MongoDB 连接失败
**A:** 检查 MongoDB 是否运行：
```bash
# macOS/Linux
ps aux | grep mongod

# 如果没运行，启动它
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### Q: 前端无法连接后端
**A:** 确保：
1. 后端运行在 5001 端口
2. 前端 package.json 中有 `"proxy": "http://localhost:5001"`

### Q: Transaction 报错
**A:** MongoDB 4.0+ 需要 Replica Set。解决方案：
1. 使用 MongoDB 4.2+ 单机版（支持单节点 Transaction）
2. 或使用 MongoDB Atlas（云服务）
3. 或配置本地 Replica Set

配置本地 Replica Set：
```bash
# 1. 修改 MongoDB 配置
echo "replication:
  replSetName: rs0" >> /usr/local/etc/mongod.conf

# 2. 重启 MongoDB
brew services restart mongodb-community

# 3. 初始化 Replica Set
mongosh
> rs.initiate()
```

### Q: 端口被占用
**A:** 修改端口：
- 后端：修改 `backend/.env` 中的 `PORT`
- 前端：创建 `frontend/.env` 文件，添加 `PORT=3001`

## 开发模式 vs 生产模式

### 开发模式（当前）
- 后端：`npm run dev` (nodemon 自动重启)
- 前端：`npm start` (热重载)
- 数据库：本地 MongoDB

### 生产部署建议
```bash
# 后端
cd backend
npm start

# 前端（构建）
cd frontend
npm run build
# 使用 serve 或 nginx 托管 build 目录
```

## 性能优化建议

对于生产环境：

1. **启用 MongoDB 索引**（已在代码中定义，自动创建）

2. **使用 PM2 管理 Node.js 进程**
```bash
npm install -g pm2
pm2 start backend/server.js --name order-backend
pm2 startup
pm2 save
```

3. **Nginx 反向代理**
```nginx
server {
  listen 80;
  
  location /api {
    proxy_pass http://localhost:5001;
  }
  
  location / {
    root /path/to/frontend/build;
    try_files $uri /index.html;
  }
}
```

## 技术支持

如遇问题：
1. 检查控制台日志
2. 查看 MongoDB 日志
3. 确保依赖版本兼容（见 package.json）

