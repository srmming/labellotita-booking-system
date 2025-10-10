# 系统架构文档

## 设计哲学

遵循 Linus Torvalds 的编程原则：

### 1. 数据结构优先
> "Bad programmers worry about the code. Good programmers worry about data structures."

整个系统围绕4个核心数据模型设计：
- **Customer**: 客户基本信息
- **Product**: 产品（组合/基础）
- **Order**: 订单（含快照）
- **Shipment**: 出货记录

### 2. 消除特殊情况
> "好品味就是能够从不同角度看问题，消除特殊情况"

**案例：出货逻辑统一处理**
```javascript
// ❌ 糟糕的设计：分支处理
if (product.type === 'combo') {
  // 处理组合产品
  for (comp of product.components) {
    deductInventory(comp.productId, comp.quantity);
  }
} else {
  // 处理基础产品
  deductInventory(product._id, 1);
}

// ✅ 好的设计：统一展开
const inventoryChanges = expandComboProducts(order, shippedItems);
for (change of inventoryChanges) {
  deductInventory(change.productId, change.quantity);
}
```

### 3. 简洁执行
> "函数应该短小精悍，只做一件事"

每个函数职责单一：
- `expandComboProducts()` - 只负责展开组合产品
- `calculateShippedQuantities()` - 只负责计算已出货数量
- `updateOrderStatus()` - 只负责更新订单状态

### 4. 实用主义
> "解决实际问题，不是假想的威胁"

- 小型业务（<1000订单/月）→ 无需Redis、消息队列
- 单一管理员 → 无需复杂权限系统
- MongoDB Transaction → 足以保证数据一致性

## 核心架构

### 技术栈选型理由

| 技术 | 选择理由 |
|------|---------|
| **MongoDB** | 文档型数据库，支持嵌入文档（订单快照），Transaction保证原子性 |
| **Express** | 简单直接，无过度抽象 |
| **React** | 组件化UI，生态成熟 |
| **Ant Design** | 开箱即用的企业级组件 |

### 数据流

```
用户操作 → React组件 → API调用 → Express路由 → Mongoose模型 → MongoDB
                                      ↓
                                  业务逻辑
                                  (Transaction)
```

## 关键设计决策

### 1. 订单快照（Snapshot）

**问题**: 如果组合产品的配方（components）后续改变，历史订单怎么办？

**方案**: 创建订单时，保存组合产品配方的快照

```javascript
// Order.items 结构
{
  productId: ObjectId,
  productName: "节日礼品套装",
  quantity: 10,
  components: [  // ← 快照！即使产品配方改了，订单不受影响
    { productId: "xxx", productName: "蜡烛", quantity: 2 },
    { productId: "yyy", productName: "香薰", quantity: 1 }
  ]
}
```

**好处**:
- ✅ 历史订单独立，不受产品变更影响
- ✅ 出货时使用快照展开，准确扣减库存
- ✅ 可追溯：每个订单都知道当时的产品配方

### 2. 数据冗余（Denormalization）

**冗余字段**:
- `Order.customerName` - 冗余客户姓名
- `Order.items[].productName` - 冗余产品名称
- `Shipment.orderNumber` - 冗余订单号

**理由**:
- 避免频繁关联查询（JOIN）
- 提升查询性能（MongoDB擅长单表查询）
- 数据自包含，即使关联记录被删也能显示

**代价**: 更新客户/产品名称时需同步（但实际很少发生）

### 3. 库存扣减时机

**不在订单创建时扣减库存**

**理由**:
1. 避免复杂的「锁定库存」逻辑
2. 订单可能被取消，回滚麻烦
3. 生产计划基于「未出货数量」，而非「未创建订单数量」

**在出货时扣减库存**

```javascript
// 原子操作：确保库存充足才扣减
Product.updateOne(
  { _id: productId, 'inventory.current': { $gte: quantity } },
  { $inc: { 'inventory.current': -quantity } }
)
```

### 4. Transaction 边界

**何时使用 Transaction**:
- ✅ 出货（多个库存扣减 + 创建记录 + 更新状态）
- ❌ 普通 CRUD（单一操作，无需事务）

**Transaction 设计**:
```javascript
session.startTransaction();
try {
  // 1. 扣减多个基础产品库存
  // 2. 创建出货记录
  // 3. 更新订单状态
  await session.commitTransaction();
} catch {
  await session.abortTransaction();
}
```

## API 设计规范

### RESTful 原则

```
GET    /api/orders          # 获取列表
GET    /api/orders/:id      # 获取单个
POST   /api/orders          # 创建
PUT    /api/orders/:id      # 完整更新
PATCH  /api/orders/:id      # 部分更新（如库存）
DELETE /api/orders/:id      # 删除
```

### 错误处理

统一错误格式：
```javascript
{
  error: {
    message: "库存不足",
    details: { ... }  // 开发模式下提供
  }
}
```

### 响应结构

```javascript
// 列表
GET /api/products → [{ ... }, { ... }]

// 详情（可能包含关联数据）
GET /api/orders/:id → {
  order: { ... },
  shipments: [ ... ],
  shippedQty: { ... }
}
```

## 前端架构

### 组件结构

```
App (路由)
 ├─ MainLayout (侧边栏 + Header)
 │   ├─ Dashboard (概览)
 │   ├─ CustomerList (客户列表)
 │   ├─ ProductList (产品列表)
 │   ├─ OrderList (订单列表)
 │   ├─ OrderForm (创建/编辑订单)
 │   ├─ OrderDetail (订单详情 + 出货)
 │   └─ ProductionPlan (生产计划)
```

### 状态管理

**无需 Redux**，使用：
- `useState` - 本地状态
- `useEffect` - 数据加载
- Props 传递

**理由**: 
- 页面独立，无复杂共享状态
- API 调用直接 async/await
- 简单清晰，无模板代码

### API 调用

集中在 `services/api.js`：
```javascript
export const orderAPI = {
  getAll: (filters) => api.get('/orders', { params: filters }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  ...
}
```

**好处**:
- 统一管理 API 端点
- 类型安全（可加 TypeScript）
- 易于 Mock 测试

## 数据库索引策略

自动创建的索引（Schema 中定义）：

```javascript
// Order
orderNumber: { unique: true, index: true }
customerId: { index: true }
status: { index: true }

// Shipment
orderId: { index: true }
orderNumber: { index: true }

// Product
type: { index: true }
```

**查询性能**:
- 按订单号查询: O(log n)
- 按客户查询订单: O(log n)
- 按状态筛选: O(log n)

## 扩展性考虑

### 当前架构支持

| 规模 | 支持情况 | 说明 |
|------|---------|------|
| 订单量 | < 10,000/月 | 单机 MongoDB 足够 |
| 并发用户 | < 100 | Node.js 单进程即可 |
| 数据量 | < 1GB | 无需分片 |

### 扩展路径

**如果业务增长：**

1. **10K - 100K 订单/月**
   - PM2 多进程
   - Redis 缓存热门数据
   - MongoDB 读写分离

2. **100K - 1M 订单/月**
   - 微服务拆分（订单服务、库存服务）
   - 消息队列（RabbitMQ）
   - MongoDB 分片

3. **> 1M 订单/月**
   - Kubernetes 容器编排
   - 分布式事务（Saga 模式）
   - 时序数据库（订单归档）

## 安全考虑

### 当前实现

- ✅ 库存扣减原子性（Transaction）
- ✅ 输入验证（Mongoose Schema）
- ✅ 错误处理统一

### 生产环境需补充

- [ ] JWT 身份认证
- [ ] HTTPS 加密
- [ ] Rate Limiting（防止API滥用）
- [ ] SQL注入防护（已有：Mongoose参数化查询）
- [ ] XSS防护（前端：React自动转义）
- [ ] CORS 配置细化

## 测试策略

### 推荐测试方案

**后端单元测试** (Jest + Supertest)
```javascript
describe('POST /api/shipments', () => {
  it('should deduct inventory correctly', async () => {
    // 测试库存扣减逻辑
  });
  
  it('should rollback on insufficient inventory', async () => {
    // 测试库存不足时回滚
  });
});
```

**前端测试** (React Testing Library)
```javascript
test('displays order items', () => {
  render(<OrderDetail />);
  expect(screen.getByText('节日礼品套装')).toBeInTheDocument();
});
```

**集成测试** (Cypress)
```javascript
it('completes full order flow', () => {
  cy.visit('/orders/new');
  cy.selectCustomer('张三');
  cy.addProduct('礼品套装', 10);
  cy.submit();
  cy.url().should('include', '/orders');
});
```

## 监控与日志

### 推荐工具

| 功能 | 工具 |
|------|------|
| 应用监控 | PM2 + Keymetrics |
| 错误追踪 | Sentry |
| 性能分析 | MongoDB Profiler |
| 日志聚合 | Winston + ELK |

### 关键指标

- API 响应时间
- Transaction 成功率
- 库存扣减失败次数
- 数据库慢查询

## 总结

这是一个**简单、实用、可维护**的订单系统架构：

✅ **数据模型清晰** - 4个核心模型，职责分明  
✅ **核心逻辑可靠** - Transaction保证库存一致性  
✅ **代码简洁直接** - 无过度抽象，易于理解  
✅ **扩展性良好** - 支持业务增长路径  

> "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away." - Antoine de Saint-Exupéry

这个系统没有多余的复杂性，只有必要的逻辑。这就是好品味。

