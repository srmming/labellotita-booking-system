# 组合产品订单管理系统

一个基于 React + Node.js + MongoDB 的组合产品预定订单系统，支持订单管理、分批出货、库存自动扣减和客户管理。

## 核心特性

### ✅ 已实现功能

1. **订单概览 (Dashboard)**
   - 关键指标统计：总订单数、待处理、出货中、已完成
   - 最近订单列表
   - 状态和付款情况可视化

2. **客户管理 (Customer Management)**
   - 客户 CRUD 操作
   - 客户订单历史查询

3. **产品管理 (Product Management)**
   - 支持两种产品类型：
     - **基础产品**：有库存管理
     - **组合产品**：由多个基础产品组成
   - 库存实时显示

4. **订单管理 (Order Management)**
   - 创建订单（选择客户、产品、数量）
   - 订单快照：创建时保存组合产品配方，避免后续变化影响历史订单
   - 付款状态跟踪：未付款/部分付款/已付款
   - 订单状态自动更新：待处理→生产中→出货中→已完成

5. **分批出货 (Shipment Tracking)** ⭐️核心功能
   - 支持多次部分出货
   - 自动展开组合产品到基础产品
   - **原子库存扣减**（MongoDB Transaction）
   - 出货进度可视化
   - 自动更新订单状态

6. **生产计划 (Production Planning)**
   - 汇总待生产订单的基础产品需求
   - 对比当前库存，标识缺货产品
   - 按缺货数量排序

## 技术架构

### 后端
- **框架**: Node.js + Express
- **数据库**: MongoDB + Mongoose
- **核心特性**: 
  - RESTful API
  - MongoDB Transaction（保证库存扣减原子性）
  - 数据冗余设计（提升查询性能）

### 前端
- **框架**: React 18
- **路由**: React Router v6
- **UI 库**: Ant Design 5
- **HTTP**: Axios
- **状态管理**: React Hooks (无需 Redux)

## 数据模型

### Customer（客户）
```javascript
{
  name: String,
  phone: String,
  email: String
}
```

### Product（产品）
```javascript
{
  name: String,
  type: 'combo' | 'base',
  components: [{ productId, quantity }],  // 仅组合产品
  inventory: { current: Number }          // 仅基础产品
}
```

### Order（订单）
```javascript
{
  orderNumber: String,  // 自动生成: ORD-20250101-0001
  customerId: ObjectId,
  customerName: String, // 冗余存储
  items: [{
    productId, 
    productName, 
    quantity,
    components: [...]   // 快照组合产品配方
  }],
  paymentStatus: 'unpaid' | 'partial' | 'paid',
  status: 'pending' | 'producing' | 'shipping' | 'completed' | 'cancelled'
}
```

### Shipment（出货记录）
```javascript
{
  orderId: ObjectId,
  orderNumber: String,
  shippedItems: [{ productId, productName, quantity }],
  shippedAt: Date,
  notes: String
}
```

## 核心逻辑：分批出货与库存扣减

### 算法流程

```
1. 用户发起出货请求
   ↓
2. 验证出货数量（不能超过订单剩余数量）
   ↓
3. 展开组合产品 → 基础产品
   例：礼品套装(1) = 蜡烛(2) + 香薰(1) + 包装盒(1)
   ↓
4. MongoDB Transaction 开始
   ├─ 扣减基础产品库存（原子操作）
   ├─ 创建出货记录
   ├─ 更新订单状态
   └─ 提交事务
   ↓
5. 成功 / 失败回滚
```

### 关键代码片段

```javascript
// routes/shipments.js - 核心逻辑
async function createShipment(orderId, shippedItems) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. 展开组合产品为基础产品
    const inventoryChanges = expandComboProducts(order, shippedItems);
    
    // 2. 扣减库存（原子操作）
    for (const change of inventoryChanges) {
      await Product.updateOne(
        { _id: change.productId, 'inventory.current': { $gte: change.quantity } },
        { $inc: { 'inventory.current': -change.quantity } },
        { session }
      );
    }
    
    // 3. 创建出货记录
    await Shipment.create([{ orderId, shippedItems, ... }], { session });
    
    // 4. 更新订单状态
    await updateOrderStatus(order, session);
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
}
```

## 项目结构

```
labellotita预定系统/
├── backend/
│   ├── models/            # Mongoose 模型
│   │   ├── Customer.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   └── Shipment.js
│   ├── routes/            # API 路由
│   │   ├── customers.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── shipments.js
│   │   └── production.js
│   ├── middlewares/
│   │   └── errorHandler.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   ├── Dashboard/
│   │   │   ├── Customers/
│   │   │   ├── Products/
│   │   │   ├── Orders/
│   │   │   └── Production/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── constants.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── README.md
```

## 快速开始

### 前置要求

- Node.js >= 14
- MongoDB >= 4.4（支持 Transaction）
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   cd labellotita预定系统
   ```

2. **安装后端依赖**
   ```bash
   cd backend
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置 MongoDB 连接
   ```

4. **启动后端**
   ```bash
   npm run dev  # 开发模式（使用 nodemon）
   # 或
   npm start    # 生产模式
   ```

5. **安装前端依赖**
   ```bash
   cd ../frontend
   npm install
   ```

6. **启动前端**
   ```bash
   npm start
   ```

7. **访问应用**
- 前端：http://localhost:3000
- 后端：http://localhost:5001

### UI 自动化测试（Playwright）

1. **安装依赖**（首次运行已在 `frontend/package.json` 中列出）
   ```bash
   cd frontend
   npm install
   ```

2. **运行端到端测试**（默认期望前端已在 `http://localhost:3000` 启动）
   ```bash
   npm run test:e2e
   ```

3. **可选模式**
   ```bash
   npm run test:e2e:headed   # 带界面运行
   npm run test:e2e:ui       # 使用 Playwright UI 调试
   ```

> 提示：如需连接不同地址，可设置环境变量 `PLAYWRIGHT_BASE_URL`。

## API 文档

### 客户 (Customers)
- `GET /api/customers` - 获取所有客户
- `GET /api/customers/:id` - 获取客户详情（含订单历史）
- `POST /api/customers` - 创建客户
- `PUT /api/customers/:id` - 更新客户
- `DELETE /api/customers/:id` - 删除客户

### 产品 (Products)
- `GET /api/products?type=base|combo` - 获取产品列表
- `GET /api/products/:id` - 获取产品详情
- `POST /api/products` - 创建产品
- `PUT /api/products/:id` - 更新产品
- `PATCH /api/products/:id/inventory` - 更新库存
- `DELETE /api/products/:id` - 删除产品

### 订单 (Orders)
- `GET /api/orders?status=...&paymentStatus=...` - 获取订单列表
- `GET /api/orders/stats` - 获取统计数据
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders` - 创建订单
- `PUT /api/orders/:id` - 更新订单
- `DELETE /api/orders/:id` - 删除订单

### 出货 (Shipments)
- `GET /api/shipments?orderId=...` - 获取出货记录
- `POST /api/shipments` - 创建出货（核心逻辑）

### 生产计划 (Production)
- `GET /api/production/plan` - 获取生产计划

## 使用示例

### 1. 创建基础产品
```
产品名称: 蜡烛
产品类型: 基础产品
初始库存: 100
```

### 2. 创建组合产品
```
产品名称: 节日礼品套装
产品类型: 组合产品
组件:
  - 蜡烛 x 2
  - 香薰 x 1
  - 包装盒 x 1
```

### 3. 创建订单
```
客户: 张三
产品: 节日礼品套装 x 10
付款状态: 部分付款
```

### 4. 分批出货
```
第一次出货: 节日礼品套装 x 5
→ 库存扣减: 蜡烛 -10, 香薰 -5, 包装盒 -5
→ 订单状态: shipping

第二次出货: 节日礼品套装 x 5
→ 库存扣减: 蜡烛 -10, 香薰 -5, 包装盒 -5
→ 订单状态: completed
```

## 设计原则（Linus风格）

### 1. 数据结构优先
> "Bad programmers worry about the code. Good programmers worry about data structures."

- 先设计数据模型，代码自然清晰
- 冗余存储（customerName, productName）避免关联查询

### 2. 消除特殊情况
> "好代码没有特殊情况"

- 组合产品和基础产品统一处理：`expandComboProducts()`
- 出货逻辑统一：无论组合还是基础，最终都转为基础产品扣减

### 3. 简洁执行
> "如果需要超过3层缩进，重新设计它"

- 函数短小精悍，单一职责
- Transaction 逻辑清晰：展开→扣减→记录→更新

### 4. 实用主义
> "解决实际问题，不是假想的威胁"

- 小型业务（< 1000订单/月）：无需复杂缓存、队列
- MongoDB Transaction：足以保证库存一致性
- 单一管理员：无需复杂权限系统

## 注意事项

### MongoDB Transaction 要求
- MongoDB >= 4.0（Replica Set）
- 或 >= 4.2（单机也支持）

如果 MongoDB 版本较低，Transaction 会失败。请升级或使用 MongoDB Atlas。

### 库存管理
- 创建订单**不扣库存**
- 仅出货时扣减（避免锁定库存的复杂性）
- 库存不足时出货失败，需先补货

### 并发控制
- MongoDB Transaction 自动处理并发
- 使用 `$gte` 条件更新确保库存不为负

## 后续优化建议

如果业务扩展，可考虑：

1. **性能优化**
   - Redis 缓存热门数据
   - MongoDB 索引优化

2. **功能扩展**
   - 订单取消与库存回滚
   - 库存预留机制
   - 批量导入/导出
   - 报表和数据分析

3. **系统增强**
   - 用户权限管理
   - 操作日志审计
   - 消息推送通知

## License

MIT

## 作者

开发于 2025 年，遵循 Linus Torvalds 的编程哲学：简单、实用、有品味。

