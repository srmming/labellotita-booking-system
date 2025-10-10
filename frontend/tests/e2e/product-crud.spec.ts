import { test, expect } from '@playwright/test';

test.describe('Product management and inventory', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByRole('heading', { name: '产品管理' })).toBeVisible();
  });

  test('switch between combo and base product tabs', async ({ page }) => {
    // 验证默认在组合产品 tab
    const comboTab = page.getByRole('tab', { name: '组合产品' });
    await expect(comboTab).toHaveClass(/ant-tabs-tab-active/);
    
    // 切换到基础产品
    await page.getByRole('tab', { name: '基础产品' }).click();
    const baseTab = page.getByRole('tab', { name: '基础产品' });
    await expect(baseTab).toHaveClass(/ant-tabs-tab-active/);
    
    // 切换回组合产品
    await comboTab.click();
    await expect(comboTab).toHaveClass(/ant-tabs-tab-active/);
  });

  test('create base product with initial inventory', async ({ page }) => {
    // 点击新增产品按钮
    await page.getByRole('button', { name: /新增产品/ }).click();
    
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('新增产品')).toBeVisible();
    
    // 填写基础产品信息
    await modal.getByLabel('产品名称').fill('测试蜡烛_基础');
    await modal.getByLabel('产品类型').click();
    await page.getByText('基础产品').click();
    
    // 验证初始库存字段出现
    await expect(modal.getByLabel('初始库存')).toBeVisible();
    await modal.getByLabel('初始库存').fill('100');
    
    // 提交
    await modal.getByRole('button', { name: '确定' }).click();
    
    // 验证成功消息
    await expect(page.getByText('创建成功')).toBeVisible();
    await expect(modal).not.toBeVisible();
    
    // 切换到基础产品tab验证
    await page.getByRole('tab', { name: '基础产品' }).click();
    await expect(page.getByText('测试蜡烛_基础')).toBeVisible();
    await expect(page.getByText('100')).toBeVisible();
  });

  test('create combo product with components', async ({ page }) => {
    // 先确保有基础产品（如果没有就创建一个）
    await page.getByRole('tab', { name: '基础产品' }).click();
    const hasBaseProducts = await page.locator('.ant-table-tbody tr').count() > 0;
    
    if (!hasBaseProducts) {
      // 创建基础产品
      await page.getByRole('button', { name: /新增产品/ }).click();
      let modal = page.locator('.ant-modal');
      await modal.getByLabel('产品名称').fill('基础蜡烛_组件');
      await modal.getByLabel('产品类型').click();
      await page.getByText('基础产品').click();
      await modal.getByLabel('初始库存').fill('50');
      await modal.getByRole('button', { name: '确定' }).click();
      await expect(page.getByText('创建成功')).toBeVisible();
    }
    
    // 切换回组合产品tab
    await page.getByRole('tab', { name: '组合产品' }).click();
    
    // 创建组合产品
    await page.getByRole('button', { name: /新增产品/ }).click();
    
    const modal = page.locator('.ant-modal');
    await modal.getByLabel('产品名称').fill('测试套装_组合');
    await modal.getByLabel('产品类型').click();
    await page.getByText('组合产品').click();
    
    // 添加组件
    await modal.getByRole('button', { name: '添加组件' }).click();
    
    // 选择基础产品和数量
    const componentSelect = modal.locator('.ant-select').filter({ hasText: '选择基础产品' }).first();
    await componentSelect.click();
    await page.locator('.ant-select-dropdown').getByText(/蜡烛/).first().click();
    
    await modal.getByPlaceholder('数量').fill('2');
    
    // 提交
    await modal.getByRole('button', { name: '确定' }).click();
    
    // 验证成功
    await expect(page.getByText('创建成功')).toBeVisible();
    await expect(page.getByText('测试套装_组合')).toBeVisible();
  });

  test('dynamic component list - add and remove', async ({ page }) => {
    await page.getByRole('button', { name: /新增产品/ }).click();
    
    const modal = page.locator('.ant-modal');
    await modal.getByLabel('产品名称').fill('动态测试产品');
    await modal.getByLabel('产品类型').click();
    await page.getByText('组合产品').click();
    
    // 添加第一个组件
    await modal.getByRole('button', { name: '添加组件' }).click();
    let componentCount = await modal.getByPlaceholder('数量').count();
    expect(componentCount).toBe(1);
    
    // 添加第二个组件
    await modal.getByRole('button', { name: '添加组件' }).click();
    componentCount = await modal.getByPlaceholder('数量').count();
    expect(componentCount).toBe(2);
    
    // 删除第一个组件
    await modal.getByRole('button', { name: '删除' }).first().click();
    componentCount = await modal.getByPlaceholder('数量').count();
    expect(componentCount).toBe(1);
    
    // 取消创建
    await modal.getByRole('button', { name: '取消' }).click();
  });

  test('adjust inventory - increase', async ({ page }) => {
    // 切换到基础产品
    await page.getByRole('tab', { name: '基础产品' }).click();
    
    // 等待表格加载
    await page.waitForSelector('.ant-table-tbody tr', { timeout: 5000 });
    
    // 获取第一个产品的当前库存
    const firstRow = page.locator('.ant-table-tbody tr').first();
    const currentInventory = await firstRow.locator('td').nth(1).textContent();
    
    // 点击库存调整
    await firstRow.getByRole('button', { name: /库存调整/ }).click();
    
    // 验证调整弹窗
    const modal = page.locator('.ant-modal').filter({ hasText: '库存调整' });
    await expect(modal).toBeVisible();
    await expect(modal.getByText(`当前库存：${currentInventory}`)).toBeVisible();
    
    // 选择增加库存
    await modal.getByLabel('增加库存').check();
    
    // 输入数量和原因
    await modal.getByLabel('调整数量').fill('50');
    await modal.getByLabel('调整原因').fill('采购入库');
    
    // 提交
    await modal.getByRole('button', { name: '确定' }).click();
    
    // 验证成功
    await expect(page.getByText('库存调整成功')).toBeVisible();
    
    // 验证库存已更新
    const newInventory = parseInt(currentInventory || '0') + 50;
    await expect(firstRow.locator('td').nth(1)).toHaveText(newInventory.toString());
  });

  test('adjust inventory - decrease', async ({ page }) => {
    // 切换到基础产品
    await page.getByRole('tab', { name: '基础产品' }).click();
    await page.waitForSelector('.ant-table-tbody tr', { timeout: 5000 });
    
    // 点击库存调整
    const firstRow = page.locator('.ant-table-tbody tr').first();
    await firstRow.getByRole('button', { name: /库存调整/ }).click();
    
    const modal = page.locator('.ant-modal').filter({ hasText: '库存调整' });
    await expect(modal).toBeVisible();
    
    // 选择减少库存
    await modal.getByLabel('减少库存').check();
    await modal.getByLabel('调整数量').fill('10');
    await modal.getByLabel('调整原因').fill('损耗');
    
    // 提交
    await modal.getByRole('button', { name: '确定' }).click();
    
    // 验证成功
    await expect(page.getByText('库存调整成功')).toBeVisible();
  });

  test('inventory adjustment requires reason', async ({ page }) => {
    // 切换到基础产品
    await page.getByRole('tab', { name: '基础产品' }).click();
    await page.waitForSelector('.ant-table-tbody tr', { timeout: 5000 });
    
    // 打开调整弹窗
    await page.locator('.ant-table-tbody tr').first().getByRole('button', { name: /库存调整/ }).click();
    
    const modal = page.locator('.ant-modal').filter({ hasText: '库存调整' });
    
    // 只填写类型和数量，不填原因
    await modal.getByLabel('增加库存').check();
    await modal.getByLabel('调整数量').fill('100');
    
    // 尝试提交
    await modal.getByRole('button', { name: '确定' }).click();
    
    // 验证错误提示
    await expect(modal.getByText('请输入调整原因')).toBeVisible();
  });

  test('view adjustment history', async ({ page }) => {
    // 切换到基础产品
    await page.getByRole('tab', { name: '基础产品' }).click();
    await page.waitForSelector('.ant-table-tbody tr', { timeout: 5000 });
    
    // 点击调整历史
    await page.locator('.ant-table-tbody tr').first().getByRole('button', { name: /调整历史/ }).click();
    
    // 验证历史弹窗
    const modal = page.locator('.ant-modal').filter({ hasText: '调整历史' });
    await expect(modal).toBeVisible();
    
    // 验证历史表格列标题
    const headers = ['时间', '类型', '数量', '调整前', '调整后', '原因'];
    for (const header of headers) {
      await expect(modal.getByText(header)).toBeVisible();
    }
  });

  test('product form type field changes UI', async ({ page }) => {
    await page.getByRole('button', { name: /新增产品/ }).click();
    const modal = page.locator('.ant-modal');
    
    await modal.getByLabel('产品名称').fill('类型切换测试');
    
    // 选择基础产品
    await modal.getByLabel('产品类型').click();
    await page.getByText('基础产品').click();
    await expect(modal.getByLabel('初始库存')).toBeVisible();
    await expect(modal.getByRole('button', { name: '添加组件' })).not.toBeVisible();
    
    // 切换到组合产品
    await modal.getByLabel('产品类型').click();
    await page.getByText('组合产品').click();
    await expect(modal.getByLabel('初始库存')).not.toBeVisible();
    await expect(modal.getByRole('button', { name: '添加组件' })).toBeVisible();
    
    await modal.getByRole('button', { name: '取消' }).click();
  });

  test('pagination works for combo products', async ({ page }) => {
    // 验证分页组件存在
    await page.getByRole('tab', { name: '组合产品' }).click();
    
    const pagination = page.locator('.ant-pagination');
    const hasPagination = await pagination.isVisible();
    
    if (hasPagination) {
      // 如果有分页，测试翻页
      const nextButton = page.getByRole('button', { name: 'Next Page' });
      const isNextEnabled = await nextButton.isEnabled();
      
      if (isNextEnabled) {
        await nextButton.click();
        // 验证页码变化
        await expect(page.locator('.ant-pagination-item-active')).toHaveText('2');
      }
    }
  });

  test('pagination works for base products', async ({ page }) => {
    await page.getByRole('tab', { name: '基础产品' }).click();
    
    const pagination = page.locator('.ant-pagination');
    const hasPagination = await pagination.isVisible();
    
    if (hasPagination) {
      const nextButton = page.getByRole('button', { name: 'Next Page' });
      const isNextEnabled = await nextButton.isEnabled();
      
      if (isNextEnabled) {
        await nextButton.click();
        await expect(page.locator('.ant-pagination-item-active')).toHaveText('2');
      }
    }
  });

  test('delete product from base products tab', async ({ page }) => {
    // 先创建一个基础产品用于删除
    await page.getByRole('tab', { name: '基础产品' }).click();
    await page.getByRole('button', { name: /新增产品/ }).click();
    
    let modal = page.locator('.ant-modal');
    await modal.getByLabel('产品名称').fill('测试产品_待删除');
    await modal.getByLabel('产品类型').click();
    await page.getByText('基础产品').click();
    await modal.getByLabel('初始库存').fill('10');
    await modal.getByRole('button', { name: '确定' }).click();
    await expect(page.getByText('创建成功')).toBeVisible();
    
    // 删除刚创建的产品
    const productRow = page.locator('tr', { hasText: '测试产品_待删除' });
    await productRow.getByRole('button', { name: /删除/ }).click();
    
    // 确认删除
    const popconfirm = page.locator('.ant-popconfirm');
    await expect(popconfirm).toBeVisible();
    await popconfirm.getByRole('button', { name: '确定' }).click();
    
    // 验证删除成功
    await expect(page.getByText('删除成功')).toBeVisible();
    await expect(page.getByText('测试产品_待删除')).not.toBeVisible();
  });
});


