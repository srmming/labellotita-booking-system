# 快速开始指南

## 5分钟上手

### 前置条件
- ✅ Node.js 已安装（v14+）
- ✅ MongoDB 已安装并运行

### 一键启动

**步骤 1: 安装依赖**
```bash
# 后端
cd backend && npm install

# 前端（新终端）
cd frontend && npm install
```

**步骤 2: 启动服务**
```bash
# 终端1 - 后端
cd backend
npm run dev

# 终端2 - 前端
cd frontend
npm start
```

**步骤 3: 访问应用**
- 打开浏览器: http://localhost:3000
- 后端API: http://localhost:5001

### 填充测试数据（可选）

```bash
cd backend
npm run seed
```

这将创建：
- 3个客户
- 5个基础产品
- 3个组合产品
- 3个示例订单

## 基本使用流程

### 1. 创建基础产品
1. 导航到 **产品管理**
2. 点击 **新增产品**
3. 填写信息：
   - 产品名称: `香薰蜡烛`
   - 产品类型: `基础产品`
   - 初始库存: `100`
4. 保存

重复以上步骤创建更多基础产品。

### 2. 创建组合产品
1. 点击 **新增产品**
2. 填写信息：
   - 产品名称: `节日礼品套装`
   - 产品类型: `组合产品`
3. 添加组件：
   - 选择 `香薰蜡烛`, 数量 `2`
   - 选择 `精油`, 数量 `1`
   - 选择 `礼品盒`, 数量 `1`
4. 保存

### 3. 创建客户
1. 导航到 **客户管理**
2. 点击 **新增客户**
3. 填写：姓名、电话、邮箱
4. 保存

### 4. 创建订单
1. 导航到 **订单管理**
2. 点击 **新建订单**
3. 选择客户
4. 添加产品：
   - 选择 `节日礼品套装`
   - 数量 `10`
5. 选择付款状态
6. 保存

### 5. 出货操作 ⭐️ 核心功能
1. 在订单列表点击 **查看详情**
2. 查看订单产品和进度
3. 点击 **新增出货**
4. 选择产品和出货数量：
   - 产品: `节日礼品套装`
   - 数量: `5` （部分出货）
5. 确认出货

**观察变化**：
- ✅ 出货记录已创建
- ✅ 订单状态变为 `出货中`
- ✅ 产品进度显示 50%
- ✅ 基础产品库存自动扣减：
  - 香薰蜡烛: -10 (5个套装 × 2)
  - 精油: -5 (5个套装 × 1)
  - 礼品盒: -5 (5个套装 × 1)

### 6. 完成出货
再次点击 **新增出货**，出货剩余的 5 个：
- ✅ 订单状态变为 `已完成`
- ✅ 进度 100%

### 7. 查看生产计划
1. 导航到 **生产计划**
2. 查看汇总的基础产品需求
3. 对比当前库存
4. 识别缺货产品（红色标记）

## 功能概览

| 页面 | 路径 | 功能 |
|------|------|------|
| 订单概览 | `/dashboard` | 统计数据、最近订单 |
| 订单管理 | `/orders` | 订单列表、筛选 |
| 订单详情 | `/orders/:id` | 出货、进度跟踪 |
| 产品管理 | `/products` | 产品CRUD、库存管理 |
| 客户管理 | `/customers` | 客户CRUD |
| 生产计划 | `/production` | 需求汇总、库存对比 |

## API 测试（可选）

使用 curl 或 Postman 测试API：

### 获取所有订单
```bash
curl http://localhost:5001/api/orders
```

### 创建客户
```bash
curl -X POST http://localhost:5001/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"测试客户","phone":"13800138000"}'
```

### 创建基础产品
```bash
curl -X POST http://localhost:5001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name":"测试蜡烛",
    "type":"base",
    "inventory":{"current":50}
  }'
```

## 常见问题

### Q: 前端无法连接后端？
**A:** 确保后端运行在 5001 端口，检查控制台日志

### Q: MongoDB 连接失败？
**A:** 确保 MongoDB 服务已启动：
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Q: 出货报错 "Transaction failed"？
**A:** MongoDB 需要 4.0+ 并配置 Replica Set。见 `INSTALL.md`

### Q: 如何重置数据？
**A:** 重新运行种子脚本：
```bash
cd backend
npm run seed
```
或者直接删除 MongoDB 数据库：
```bash
mongosh
> use order-system
> db.dropDatabase()
```

## 下一步

- 📖 阅读 [`README.md`](./README.md) - 完整功能说明
- 🏗️ 阅读 [`ARCHITECTURE.md`](./ARCHITECTURE.md) - 架构设计文档
- 🔧 阅读 [`INSTALL.md`](./INSTALL.md) - 详细安装指南
- 🚀 开始自定义开发

## 技术支持

遇到问题？
1. 检查终端日志
2. 查看浏览器控制台
3. 参考文档目录下的其他 `.md` 文件

祝使用愉快！🎉

