# 数据迁移指南

## 从本地 MongoDB 迁移到云端 MongoDB Atlas

### 第一步：导出本地数据

```bash
# 在项目根目录执行
cd backend
node scripts/export-data.js
```

导出的数据文件位于 `backend/exports/backup-<时间戳>.json`

### 第二步：创建 MongoDB Atlas 账号和集群

1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. 注册并登录
3. 创建免费集群 (M0 Sandbox - 512MB 存储)
4. 配置数据库访问：
   - Database Access → Add New Database User
   - 创建用户名和密码（记住这些信息）
5. 配置网络访问：
   - Network Access → Add IP Address
   - 选择 "Allow Access from Anywhere" (0.0.0.0/0) 或添加特定 IP

### 第三步：获取连接字符串

1. 在 Atlas 控制台点击 "Connect"
2. 选择 "Connect your application"
3. 复制连接字符串，格式如下：
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. 替换 `<username>` 和 `<password>` 为实际值
5. 在末尾添加数据库名：
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/order-system?retryWrites=true&w=majority
   ```

### 第四步：导入数据到云端

```bash
# 设置云端连接字符串并导入数据
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/order-system?retryWrites=true&w=majority" node scripts/import-data.js exports/backup-<时间戳>.json
```

**注意**：
- 替换 `<时间戳>` 为实际的备份文件名
- 脚本会自动检查目标数据库是否为空，避免数据冲突
- 如果目标数据库不为空，导入会被取消

### 第五步：验证数据

使用 MongoDB Atlas Web UI 查看数据：
1. 在 Atlas 控制台点击 "Browse Collections"
2. 检查以下集合的数据：
   - customers
   - products
   - orders
   - shipments
   - inventoryadjustments

### 第六步：更新生产环境配置

在部署平台（Railway/Heroku/Render）设置环境变量：

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/order-system?retryWrites=true&w=majority
NODE_ENV=production
PORT=5001
```

### 本地与云端环境切换

**本地开发环境** (`backend/.env`)：
```bash
MONGODB_URI=mongodb://localhost:27017/order-system
NODE_ENV=development
```

**生产环境** (部署平台环境变量)：
```bash
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
```

### 定期备份

建议定期导出数据作为备份：

```bash
# 每周或每月执行
node scripts/export-data.js
```

备份文件保存在 `backend/exports/` 目录。

### 故障恢复

如果云端数据出现问题，可以从备份文件恢复：

```bash
# 1. 清空云端数据库（在 Atlas Web UI 中手动删除集合）
# 2. 导入最新备份
MONGODB_URI="mongodb+srv://..." node scripts/import-data.js exports/backup-<最新时间戳>.json
```

### 使用 mongodump/mongorestore（备选方案）

如果数据量较大，可以使用 MongoDB 官方工具：

**导出本地数据**：
```bash
mongodump --uri="mongodb://localhost:27017/order-system" --out=./dumps
```

**导入到云端**：
```bash
mongorestore --uri="mongodb+srv://..." --dir=./dumps
```

### 常见问题

**Q: 导入时提示 "目标数据库不为空"？**
A: 在 Atlas Web UI 中手动删除所有集合，或创建新的数据库。

**Q: 连接云端数据库失败？**
A: 检查以下几点：
- 用户名密码是否正确
- 网络访问白名单是否已添加
- 连接字符串格式是否正确

**Q: 数据迁移后本地开发怎么办？**
A: 保持本地 MongoDB，开发时使用本地数据库，部署时使用云端数据库。

**Q: 如何同步本地和云端数据？**
A: 不建议同步。建议：
- 开发环境使用本地数据库（测试数据）
- 生产环境使用云端数据库（真实数据）
- 定期从生产环境导出数据到本地用于调试

