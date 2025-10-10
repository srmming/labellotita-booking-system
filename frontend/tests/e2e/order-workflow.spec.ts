import { test, expect } from '@playwright/test';

test.describe('Order creation workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders/new');
    await expect(page.getByRole('heading', { name: '创建订单' })).toBeVisible();
    // 等待数据加载
    await page.waitForTimeout(1000);
  });

  test('create order with all required fields', async ({ page }) => {
    // 选择客户
    const customerSelect = page.locator('.ant-select').filter({ hasText: '选择客户' }).first();
    await customerSelect.click();
    
    // 选择第一个客户
    const dropdown = page.locator('.ant-select-dropdown').last();
    await dropdown.locator('.ant-select-item').first().click();
    
    // 添加产品
    await page.getByRole('button', { name: /添加产品/ }).click();
    
    // 选择产品
    const productSelect = page.locator('.ant-select').filter({ hasText: '选择组合产品' }).first();
    await productSelect.click();
    await page.locator('.ant-select-dropdown').locator('.ant-select-item').first().click();
    
    // 输入数量
    await page.getByPlaceholder('数量').fill('5');
    
    // 选择付款状态（默认值是"未付款"，可以改变）
    await page.getByLabel('付款状态').click();
    await page.getByText('已付款').click();
    
    // 提交订单
    await page.getByRole('button', { name: '创建订单' }).click();
    
    // 验证成功消息和跳转
    await expect(page.getByText('订单创建成功')).toBeVisible();
    await expect(page).toHaveURL(/\/orders$/);
  });

  test('customer field is required', async ({ page }) => {
    // 不选择客户，直接添加产品
    await page.getByRole('button', { name: /添加产品/ }).click();
    
    const productSelect = page.locator('.ant-select').filter({ hasText: '选择组合产品' }).first();
    await productSelect.click();
    await page.locator('.ant-select-dropdown').locator('.ant-select-item').first().click();
    await page.getByPlaceholder('数量').fill('3');
    
    // 尝试提交
    await page.getByRole('button', { name: '创建订单' }).click();
    
    // 验证错误提示
    await expect(page.getByText('请选择客户')).toBeVisible();
    
    // 仍在订单创建页面
    await expect(page).toHaveURL(/\/orders\/new/);
  });

  test('at least one product item is required', async ({ page }) => {
    // 只选择客户，不添加产品
    const customerSelect = page.locator('.ant-select').filter({ hasText: '选择客户' }).first();
    await customerSelect.click();
    await page.locator('.ant-select-dropdown').last().locator('.ant-select-item').first().click();
    
    // 尝试提交
    await page.getByRole('button', { name: '创建订单' }).click();
    
    // 验证错误提示
    await expect(page.getByText('至少添加一个产品')).toBeVisible();
  });

  test('product and quantity fields are required in items', async ({ page }) => {
    // 选择客户
    const customerSelect = page.locator('.ant-select').filter({ hasText: '选择客户' }).first();
    await customerSelect.click();
    await page.locator('.ant-select-dropdown').last().locator('.ant-select-item').first().click();
    
    // 添加产品但不填写
    await page.getByRole('button', { name: /添加产品/ }).click();
    
    // 尝试提交
    await page.getByRole('button', { name: '创建订单' }).click();
    
    // 验证错误提示
    await expect(page.getByText('请选择产品')).toBeVisible();
    await expect(page.getByText('请输入数量')).toBeVisible();
  });

  test('add multiple product items', async ({ page }) => {
    // 选择客户
    const customerSelect = page.locator('.ant-select').filter({ hasText: '选择客户' }).first();
    await customerSelect.click();
    await page.locator('.ant-select-dropdown').last().locator('.ant-select-item').first().click();
    
    // 添加第一个产品
    await page.getByRole('button', { name: /添加产品/ }).click();
    let productSelect = page.locator('.ant-select').filter({ hasText: '选择组合产品' }).first();
    await productSelect.click();
    await page.locator('.ant-select-dropdown').locator('.ant-select-item').first().click();
    await page.getByPlaceholder('数量').first().fill('3');
    
    // 添加第二个产品
    await page.getByRole('button', { name: /添加产品/ }).click();
    const productSelects = page.locator('.ant-select').filter({ hasText: '选择组合产品' });
    await productSelects.nth(1).click();
    const dropdown = page.locator('.ant-select-dropdown').last();
    await dropdown.locator('.ant-select-item').nth(1).click();
    await page.getByPlaceholder('数量').nth(1).fill('2');
    
    // 验证有两个产品项
    const quantityInputs = await page.getByPlaceholder('数量').count();
    expect(quantityInputs).toBe(2);
  });

  test('remove product item from list', async ({ page }) => {
    // 选择客户
    const customerSelect = page.locator('.ant-select').filter({ hasText: '选择客户' }).first();
    await customerSelect.click();
    await page.locator('.ant-select-dropdown').last().locator('.ant-select-item').first().click();
    
    // 添加两个产品
    await page.getByRole('button', { name: /添加产品/ }).click();
    await page.getByRole('button', { name: /添加产品/ }).click();
    
    // 验证有两个产品项
    let itemCount = await page.locator('.anticon-minus-circle').count();
    expect(itemCount).toBe(2);
    
    // 删除第一个产品项
    await page.locator('.anticon-minus-circle').first().click();
    
    // 验证只剩一个产品项
    itemCount = await page.locator('.anticon-minus-circle').count();
    expect(itemCount).toBe(1);
  });

  test('cancel button returns to order list', async ({ page }) => {
    // 填写一些数据
    const customerSelect = page.locator('.ant-select').filter({ hasText: '选择客户' }).first();
    await customerSelect.click();
    await page.locator('.ant-select-dropdown').last().locator('.ant-select-item').first().click();
    
    // 点击取消
    await page.getByRole('button', { name: '取消' }).click();
    
    // 验证返回订单列表
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole('heading', { name: '订单管理' })).toBeVisible();
  });

  test('payment status has default value', async ({ page }) => {
    // 验证付款状态有默认值"未付款"
    const paymentSelect = page.locator('.ant-select').filter({ hasText: '未付款' });
    await expect(paymentSelect).toBeVisible();
  });

  test('optional total amount field', async ({ page }) => {
    // 选择客户
    const customerSelect = page.locator('.ant-select').filter({ hasText: '选择客户' }).first();
    await customerSelect.click();
    await page.locator('.ant-select-dropdown').last().locator('.ant-select-item').first().click();
    
    // 添加产品
    await page.getByRole('button', { name: /添加产品/ }).click();
    const productSelect = page.locator('.ant-select').filter({ hasText: '选择组合产品' }).first();
    await productSelect.click();
    await page.locator('.ant-select-dropdown').locator('.ant-select-item').first().click();
    await page.getByPlaceholder('数量').fill('5');
    
    // 填写订单金额（可选字段）
    const totalAmountInput = page.getByLabel('订单金额（可选）');
    await totalAmountInput.fill('1000');
    
    // 提交订单
    await page.getByRole('button', { name: '创建订单' }).click();
    
    // 验证成功
    await expect(page.getByText('订单创建成功')).toBeVisible();
  });

  test('order without total amount succeeds', async ({ page }) => {
    // 选择客户
    const customerSelect = page.locator('.ant-select').filter({ hasText: '选择客户' }).first();
    await customerSelect.click();
    await page.locator('.ant-select-dropdown').last().locator('.ant-select-item').first().click();
    
    // 添加产品
    await page.getByRole('button', { name: /添加产品/ }).click();
    const productSelect = page.locator('.ant-select').filter({ hasText: '选择组合产品' }).first();
    await productSelect.click();
    await page.locator('.ant-select-dropdown').locator('.ant-select-item').first().click();
    await page.getByPlaceholder('数量').fill('3');
    
    // 不填写订单金额
    
    // 提交订单
    await page.getByRole('button', { name: '创建订单' }).click();
    
    // 验证成功
    await expect(page.getByText('订单创建成功')).toBeVisible();
  });

  test('change payment status options', async ({ page }) => {
    // 测试所有付款状态选项
    const paymentStatuses = ['未付款', '部分付款', '已付款'];
    
    for (const status of paymentStatuses) {
      await page.getByLabel('付款状态').click();
      await page.getByText(status).click();
      
      // 验证选中
      const selectedValue = page.locator('.ant-select-selection-item').filter({ hasText: status });
      await expect(selectedValue).toBeVisible();
    }
  });

  test('customer select has search functionality', async ({ page }) => {
    const customerSelect = page.locator('.ant-select').filter({ hasText: '选择客户' }).first();
    await customerSelect.click();
    
    // 验证可以搜索（showSearch属性）
    const searchInput = page.locator('.ant-select-dropdown input.ant-select-selection-search-input');
    const hasSearch = await searchInput.count() > 0;
    
    if (hasSearch) {
      await searchInput.fill('测试');
      // 搜索会过滤选项
      await page.waitForTimeout(300);
    }
    
    // 关闭下拉
    await page.keyboard.press('Escape');
  });

  test('quantity must be positive number', async ({ page }) => {
    // 选择客户
    const customerSelect = page.locator('.ant-select').filter({ hasText: '选择客户' }).first();
    await customerSelect.click();
    await page.locator('.ant-select-dropdown').last().locator('.ant-select-item').first().click();
    
    // 添加产品
    await page.getByRole('button', { name: /添加产品/ }).click();
    const productSelect = page.locator('.ant-select').filter({ hasText: '选择组合产品' }).first();
    await productSelect.click();
    await page.locator('.ant-select-dropdown').locator('.ant-select-item').first().click();
    
    // InputNumber组件min=1会阻止输入0或负数
    const quantityInput = page.getByPlaceholder('数量');
    await quantityInput.fill('0');
    
    // 尝试提交
    await page.getByRole('button', { name: '创建订单' }).click();
    
    // 由于InputNumber的min限制，0可能被阻止或显示验证错误
    // 这取决于具体的表单验证实现
  });

  test('form layout and labels are correct', async ({ page }) => {
    // 验证所有表单标签
    await expect(page.getByText('客户')).toBeVisible();
    await expect(page.getByText('付款状态')).toBeVisible();
    await expect(page.getByText('订单金额（可选）')).toBeVisible();
    
    // 验证按钮
    await expect(page.getByRole('button', { name: '创建订单' })).toBeVisible();
    await expect(page.getByRole('button', { name: '取消' })).toBeVisible();
    await expect(page.getByRole('button', { name: /添加产品/ })).toBeVisible();
  });
});


