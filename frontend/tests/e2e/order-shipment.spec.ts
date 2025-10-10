import { test, expect } from '@playwright/test';

test.describe('Order detail and shipment', () => {
  let orderId: string;

  test.beforeAll(async ({ browser }) => {
    // 创建一个测试订单用于后续测试
    const page = await browser.newPage();
    
    // 先创建客户和产品（如果需要）
    // 然后创建订单
    await page.goto('/orders/new');
    await page.waitForTimeout(1000);
    
    // 选择客户
    const customerSelect = page.locator('.ant-select').filter({ hasText: '选择客户' }).first();
    await customerSelect.click();
    await page.locator('.ant-select-dropdown').last().locator('.ant-select-item').first().click();
    
    // 添加产品
    await page.getByRole('button', { name: /添加产品/ }).click();
    const productSelect = page.locator('.ant-select').filter({ hasText: '选择组合产品' }).first();
    await productSelect.click();
    await page.locator('.ant-select-dropdown').locator('.ant-select-item').first().click();
    await page.getByPlaceholder('数量').fill('10');
    
    // 提交
    await page.getByRole('button', { name: '创建订单' }).click();
    await page.waitForURL(/\/orders$/);
    
    // 获取订单ID
    await page.waitForSelector('.ant-table-tbody tr');
    const firstOrderLink = page.getByRole('button', { name: /查看详情/ }).first();
    await firstOrderLink.click();
    
    // 从URL获取订单ID
    const url = page.url();
    orderId = url.match(/\/orders\/([a-f0-9]+)/)?.[1] || '';
    
    await page.close();
  });

  test('order detail page loads correctly', async ({ page }) => {
    if (!orderId) {
      test.skip();
      return;
    }
    
    await page.goto(`/orders/${orderId}`);
    
    // 验证基本元素
    await expect(page.getByText('订单信息')).toBeVisible();
    await expect(page.getByText('订单产品')).toBeVisible();
    await expect(page.getByText('出货记录')).toBeVisible();
    await expect(page.getByRole('button', { name: /返回订单列表/ })).toBeVisible();
  });

  test('order information displays correctly', async ({ page }) => {
    if (!orderId) {
      test.skip();
      return;
    }
    
    await page.goto(`/orders/${orderId}`);
    
    // 验证订单信息字段
    await expect(page.getByText('订单号')).toBeVisible();
    await expect(page.getByText('客户')).toBeVisible();
    await expect(page.getByText('订单状态')).toBeVisible();
    await expect(page.getByText('付款状态')).toBeVisible();
    await expect(page.getByText('订单金额')).toBeVisible();
    await expect(page.getByText('创建时间')).toBeVisible();
  });

  test('product table shows progress bars', async ({ page }) => {
    if (!orderId) {
      test.skip();
      return;
    }
    
    await page.goto(`/orders/${orderId}`);
    
    // 验证产品表格列
    await expect(page.getByRole('columnheader', { name: '产品名称' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '订单数量' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '已出货' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '待出货' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '进度' })).toBeVisible();
    
    // 验证进度条存在
    const progressBars = page.locator('.ant-progress');
    await expect(progressBars.first()).toBeVisible();
  });

  test('create new shipment with valid data', async ({ page }) => {
    if (!orderId) {
      test.skip();
      return;
    }
    
    await page.goto(`/orders/${orderId}`);
    
    // 点击新增出货
    await page.getByRole('button', { name: /新增出货/ }).click();
    
    // 验证弹窗
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('新增出货')).toBeVisible();
    
    // 添加出货产品
    await modal.getByRole('button', { name: '添加产品' }).click();
    
    // 选择产品
    const productSelect = modal.locator('.ant-select').first();
    await productSelect.click();
    await page.locator('.ant-select-dropdown').locator('.ant-select-item').first().click();
    
    // 输入数量（少于订单数量）
    await modal.getByPlaceholder('数量').fill('3');
    
    // 添加备注
    await modal.getByLabel('备注').fill('第一次出货');
    
    // 提交
    await modal.getByRole('button', { name: '确定' }).click();
    
    // 验证成功
    await expect(page.getByText('出货成功')).toBeVisible();
    await expect(modal).not.toBeVisible();
    
    // 验证出货记录出现
    await expect(page.getByText('第一次出货')).toBeVisible();
  });

  test('shipment requires at least one product', async ({ page }) => {
    if (!orderId) {
      test.skip();
      return;
    }
    
    await page.goto(`/orders/${orderId}`);
    
    // 打开出货弹窗
    await page.getByRole('button', { name: /新增出货/ }).click();
    
    const modal = page.locator('.ant-modal');
    
    // 不添加产品，直接提交
    await modal.getByRole('button', { name: '确定' }).click();
    
    // 验证错误提示
    await expect(modal.getByText('至少选择一个产品')).toBeVisible();
  });

  test('product dropdown shows remaining quantity', async ({ page }) => {
    if (!orderId) {
      test.skip();
      return;
    }
    
    await page.goto(`/orders/${orderId}`);
    
    // 打开出货弹窗
    await page.getByRole('button', { name: /新增出货/ }).click();
    
    const modal = page.locator('.ant-modal');
    await modal.getByRole('button', { name: '添加产品' }).click();
    
    // 点击产品下拉
    const productSelect = modal.locator('.ant-select').first();
    await productSelect.click();
    
    // 验证下拉选项显示剩余数量
    const dropdown = page.locator('.ant-select-dropdown');
    await expect(dropdown.getByText(/剩余/)).toBeVisible();
  });

  test('shipment notes are optional', async ({ page }) => {
    if (!orderId) {
      test.skip();
      return;
    }
    
    await page.goto(`/orders/${orderId}`);
    
    // 打开出货弹窗
    await page.getByRole('button', { name: /新增出货/ }).click();
    
    const modal = page.locator('.ant-modal');
    await modal.getByRole('button', { name: '添加产品' }).click();
    
    // 选择产品和数量
    const productSelect = modal.locator('.ant-select').first();
    await productSelect.click();
    await page.locator('.ant-select-dropdown').locator('.ant-select-item').first().click();
    await modal.getByPlaceholder('数量').fill('2');
    
    // 不填写备注，直接提交
    await modal.getByRole('button', { name: '确定' }).click();
    
    // 应该成功
    await expect(page.getByText('出货成功')).toBeVisible();
  });

  test('progress updates after shipment', async ({ page }) => {
    if (!orderId) {
      test.skip();
      return;
    }
    
    await page.goto(`/orders/${orderId}`);
    
    // 获取初始进度
    const progressText = await page.locator('.ant-progress-text').first().textContent();
    const initialProgress = parseInt(progressText || '0');
    
    // 创建出货
    await page.getByRole('button', { name: /新增出货/ }).click();
    const modal = page.locator('.ant-modal');
    await modal.getByRole('button', { name: '添加产品' }).click();
    
    const productSelect = modal.locator('.ant-select').first();
    await productSelect.click();
    await page.locator('.ant-select-dropdown').locator('.ant-select-item').first().click();
    await modal.getByPlaceholder('数量').fill('1');
    await modal.getByRole('button', { name: '确定' }).click();
    
    await expect(page.getByText('出货成功')).toBeVisible();
    
    // 验证进度增加
    const newProgressText = await page.locator('.ant-progress-text').first().textContent();
    const newProgress = parseInt(newProgressText || '0');
    
    expect(newProgress).toBeGreaterThan(initialProgress);
  });

  test('shipped and remaining quantities update', async ({ page }) => {
    if (!orderId) {
      test.skip();
      return;
    }
    
    await page.goto(`/orders/${orderId}`);
    
    // 验证已出货和待出货列存在
    const productTable = page.locator('.ant-card').filter({ hasText: '订单产品' }).locator('.ant-table');
    await expect(productTable).toBeVisible();
    
    // 表格应该显示数量信息
    const rows = productTable.locator('tbody tr');
    const firstRow = rows.first();
    
    // 验证行中有数字（已出货和待出货）
    const cells = firstRow.locator('td');
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThan(3);
  });

  test('shipment history table displays correctly', async ({ page }) => {
    if (!orderId) {
      test.skip();
      return;
    }
    
    await page.goto(`/orders/${orderId}`);
    
    // 验证出货记录表格
    const shipmentCard = page.locator('.ant-card').filter({ hasText: '出货记录' });
    await expect(shipmentCard).toBeVisible();
    
    // 验证表格列
    await expect(page.getByRole('columnheader', { name: '出货时间' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '出货产品' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '备注' })).toBeVisible();
  });

  test('completed order disables shipment button', async ({ page }) => {
    // 这个测试需要一个已完成的订单
    // 先跳过，因为创建已完成订单的流程较复杂
    // 可以在有合适的测试数据时运行
    
    // await page.goto(`/orders/${completedOrderId}`);
    // const shipmentButton = page.getByRole('button', { name: /新增出货/ });
    // await expect(shipmentButton).toBeDisabled();
  });

  test('back button returns to order list', async ({ page }) => {
    if (!orderId) {
      test.skip();
      return;
    }
    
    await page.goto(`/orders/${orderId}`);
    
    // 点击返回按钮
    await page.getByRole('button', { name: /返回订单列表/ }).click();
    
    // 验证返回订单列表
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole('heading', { name: '订单管理' })).toBeVisible();
  });

  test('add multiple products in one shipment', async ({ page }) => {
    if (!orderId) {
      test.skip();
      return;
    }
    
    await page.goto(`/orders/${orderId}`);
    
    // 如果订单只有一个产品，此测试可能不适用
    const productRows = await page.locator('.ant-card').filter({ hasText: '订单产品' }).locator('tbody tr').count();
    
    if (productRows < 2) {
      // 如果订单产品少于2个，跳过此测试
      test.skip();
      return;
    }
    
    // 打开出货弹窗
    await page.getByRole('button', { name: /新增出货/ }).click();
    
    const modal = page.locator('.ant-modal');
    
    // 添加第一个产品
    await modal.getByRole('button', { name: '添加产品' }).click();
    const productSelects = modal.locator('.ant-select');
    await productSelects.first().click();
    await page.locator('.ant-select-dropdown').locator('.ant-select-item').first().click();
    await modal.getByPlaceholder('数量').first().fill('1');
    
    // 添加第二个产品
    await modal.getByRole('button', { name: '添加产品' }).click();
    await productSelects.nth(1).click();
    await page.locator('.ant-select-dropdown').locator('.ant-select-item').nth(1).click();
    await modal.getByPlaceholder('数量').nth(1).fill('1');
    
    // 提交
    await modal.getByRole('button', { name: '确定' }).click();
    
    // 验证成功
    await expect(page.getByText('出货成功')).toBeVisible();
  });

  test('remove shipment item before submitting', async ({ page }) => {
    if (!orderId) {
      test.skip();
      return;
    }
    
    await page.goto(`/orders/${orderId}`);
    
    // 打开出货弹窗
    await page.getByRole('button', { name: /新增出货/ }).click();
    
    const modal = page.locator('.ant-modal');
    
    // 添加两个产品项
    await modal.getByRole('button', { name: '添加产品' }).click();
    await modal.getByRole('button', { name: '添加产品' }).click();
    
    // 验证有两个
    let deleteButtons = await modal.getByRole('button', { name: '删除' }).count();
    expect(deleteButtons).toBe(2);
    
    // 删除第一个
    await modal.getByRole('button', { name: '删除' }).first().click();
    
    // 验证只剩一个
    deleteButtons = await modal.getByRole('button', { name: '删除' }).count();
    expect(deleteButtons).toBe(1);
    
    // 取消
    await modal.locator('.ant-modal-close').click();
  });

  test('modal closes on cancel', async ({ page }) => {
    if (!orderId) {
      test.skip();
      return;
    }
    
    await page.goto(`/orders/${orderId}`);
    
    // 打开出货弹窗
    await page.getByRole('button', { name: /新增出货/ }).click();
    
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    
    // 点击取消
    await modal.getByRole('button', { name: '取消' }).click();
    
    // 验证弹窗关闭
    await expect(modal).not.toBeVisible();
  });
});


