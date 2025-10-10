# E2E 功能测试指南

## 测试概览

本项目使用 Playwright 进行端到端(E2E)功能测试，覆盖以下核心场景：

### 测试文件组织

```
frontend/tests/e2e/
├── dashboard.spec.ts              # Dashboard页面和导航测试
├── keyboard-interaction.spec.ts   # 键盘交互测试
├── navigation.spec.ts             # 页面加载与路由跳转测试 ✨
├── customer-crud.spec.ts          # 客户管理CRUD测试 ✨
├── product-crud.spec.ts           # 产品管理和库存测试 ✨
├── order-workflow.spec.ts         # 订单创建流程测试 ✨
├── order-shipment.spec.ts         # 订单详情与出货测试 ✨
└── filters-search.spec.ts         # 筛选和搜索功能测试 ✨
```

**✨ 标记为本次新增的测试文件**

## 测试覆盖范围

### 1. 页面加载与跳转 (navigation.spec.ts)
- ✅ 根路径自动重定向到 dashboard
- ✅ 所有导航菜单链接正确跳转
- ✅ 列表页到详情页的跳转流程
- ✅ 表单页取消按钮返回
- ✅ 无效ID的错误处理
- ✅ 菜单项选中状态
- ✅ 直接URL访问各路由

### 2. 客户管理 (customer-crud.spec.ts)
- ✅ 创建新客户（必填字段验证）
- ✅ 编辑现有客户（数据回填）
- ✅ 删除客户（确认流程）
- ✅ 表单错误提示
- ✅ 成功消息显示
- ✅ Modal 打开/关闭
- ✅ 取消操作

### 3. 产品管理 (product-crud.spec.ts)
- ✅ Tab 切换（组合产品 ↔ 基础产品）
- ✅ 基础产品创建（类型、库存）
- ✅ 组合产品创建（动态组件列表）
- ✅ 库存调整（增加/减少）
- ✅ 调整历史查看
- ✅ 表单字段联动
- ✅ 分页功能
- ✅ 产品删除

### 4. 订单创建流程 (order-workflow.spec.ts)
- ✅ 完整订单创建流程
- ✅ 客户选择验证
- ✅ 产品列表验证（至少一个产品）
- ✅ 产品和数量必填
- ✅ 动态添加/删除产品项
- ✅ 付款状态选择
- ✅ 可选订单金额字段
- ✅ 取消操作
- ✅ 客户搜索功能

### 5. 订单详情与出货 (order-shipment.spec.ts)
- ✅ 订单详情页加载
- ✅ 订单信息展示
- ✅ 产品进度条显示
- ✅ 创建出货记录
- ✅ 出货产品验证
- ✅ 剩余数量提示
- ✅ 可选备注字段
- ✅ 出货后状态更新
- ✅ 已完成订单禁用出货
- ✅ 多产品出货

### 6. 筛选与搜索 (filters-search.spec.ts)
- ✅ 订单状态筛选（待处理/生产中/出货中/已完成）
- ✅ 付款状态筛选（未付款/部分付款/已付款）
- ✅ 组合筛选
- ✅ 清除筛选
- ✅ 空结果处理
- ✅ 筛选UI可访问性
- ✅ 表格数据更新

## 运行测试

### 前置准备

1. **确保后端服务运行**
   ```bash
   cd backend
   npm start
   ```

2. **确保前端服务运行**
   ```bash
   cd frontend
   npm start
   ```

3. **安装 Playwright 浏览器**（首次运行需要）
   ```bash
   npx playwright install
   ```

### 运行命令

#### 1. 运行所有测试
```bash
cd frontend
npx playwright test
```

#### 2. 运行特定测试文件
```bash
# 导航测试
npx playwright test navigation.spec.ts

# 客户CRUD测试
npx playwright test customer-crud.spec.ts

# 产品和库存测试
npx playwright test product-crud.spec.ts

# 订单流程测试
npx playwright test order-workflow.spec.ts

# 出货测试
npx playwright test order-shipment.spec.ts

# 筛选测试
npx playwright test filters-search.spec.ts
```

#### 3. UI 模式（推荐用于调试）
```bash
npx playwright test --ui
```

#### 4. 调试模式
```bash
npx playwright test --debug
```

#### 5. 只运行失败的测试
```bash
npx playwright test --last-failed
```

#### 6. 查看测试报告
```bash
npx playwright show-report
```

#### 7. 特定浏览器测试
```bash
# Chromium
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# WebKit (Safari)
npx playwright test --project=webkit
```

## 测试数据策略

### 数据准备
- 测试使用真实的数据库环境
- 所有测试数据使用 `测试_` 前缀，便于识别
- 每个测试用例尽量独立，自行准备所需数据

### 数据清理
- 部分测试会在执行过程中创建测试数据
- 建议定期清理带 `测试_` 前缀的数据
- 或使用独立的测试数据库

## CI/CD 集成

测试已配置为可在 CI 环境中运行：

```yaml
# .github/workflows/test.yml 示例
- name: Run E2E tests
  run: |
    cd frontend
    npm ci
    npx playwright install --with-deps
    npx playwright test
```

配置文件 `playwright.config.js` 已包含 CI 环境的特殊设置：
- 自动启动前端服务器
- 失败时保存视频
- 重试机制
- HTML 报告

## 调试技巧

### 1. 使用 UI 模式
```bash
npx playwright test --ui
```
- 可视化查看测试执行
- 逐步调试
- 查看每个步骤的截图

### 2. 使用 trace 查看器
```bash
npx playwright show-trace trace.zip
```

### 3. 添加调试断点
在测试代码中添加：
```typescript
await page.pause();  // 暂停执行，打开调试器
```

### 4. 查看控制台日志
```typescript
page.on('console', msg => console.log(msg.text()));
```

### 5. 截图调试
```typescript
await page.screenshot({ path: 'debug.png' });
```

## 常见问题

### Q1: 测试超时失败
**原因**：页面加载慢或元素未找到  
**解决**：
- 增加等待时间：`await page.waitForSelector('.element', { timeout: 10000 })`
- 检查元素选择器是否正确
- 确保后端API正常响应

### Q2: 元素找不到
**原因**：选择器不准确或元素未渲染  
**解决**：
- 使用更具体的选择器
- 添加等待：`await expect(element).toBeVisible()`
- 检查元素是否在Modal或其他容器内

### Q3: 测试数据冲突
**原因**：多个测试使用相同数据  
**解决**：
- 使用唯一的测试数据名称（添加时间戳）
- 测试前清理旧数据
- 使用独立的测试数据库

### Q4: 下拉选择器无法点击
**原因**：Ant Design的下拉需要特殊处理  
**解决**：
```typescript
// 先点击打开下拉
await page.locator('.ant-select').click();
// 再选择选项
await page.locator('.ant-select-dropdown').getByText('选项').click();
```

## 最佳实践

### 1. 使用明确的等待
❌ 避免使用固定延迟：
```typescript
await page.waitForTimeout(1000);  // 不推荐
```

✅ 使用条件等待：
```typescript
await page.waitForURL(/\/orders/);
await expect(element).toBeVisible();
```

### 2. 合理的断言
```typescript
// 检查元素可见性
await expect(page.getByText('成功')).toBeVisible();

// 检查URL
await expect(page).toHaveURL(/\/dashboard/);

// 检查文本内容
await expect(element).toHaveText('期望文本');
```

### 3. 测试隔离
- 每个测试独立运行
- 不依赖其他测试的执行顺序
- beforeEach 中准备测试环境

### 4. 有意义的测试名称
```typescript
test('create order with all required fields', async ({ page }) => {
  // 清晰描述测试目的
});
```

## 测试报告

测试完成后，查看报告：

```bash
npx playwright show-report
```

报告包含：
- 每个测试的执行状态
- 失败测试的详细信息
- 截图和视频（如果启用）
- 执行时间统计

## 性能考虑

- 测试套件完整运行约需 **5-10分钟**（取决于数据量）
- 单个测试文件约需 **30-60秒**
- 使用并行执行加速（Playwright 默认并行）

## 维护建议

1. **定期更新测试**：当UI或业务逻辑变化时同步更新
2. **修复不稳定测试**：如果测试偶尔失败，找出根本原因
3. **添加新功能测试**：新功能上线前添加对应测试
4. **清理过时测试**：删除已废弃功能的测试
5. **文档同步**：测试变更时更新本文档

## 联系与反馈

如有测试相关问题或建议，请：
- 查看 Playwright 官方文档：https://playwright.dev
- 检查项目 issue 列表
- 联系开发团队

---

**祝测试顺利！** 🎉


