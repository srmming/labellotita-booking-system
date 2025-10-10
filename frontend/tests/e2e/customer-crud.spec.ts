import { test, expect } from '@playwright/test';

test.describe('Customer CRUD operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customers');
    await expect(page.getByRole('heading', { name: '客户管理' })).toBeVisible();
  });

  test('create new customer with valid data', async ({ page }) => {
    // 点击新增客户按钮
    await page.getByRole('button', { name: /新增客户/ }).click();
    
    // 验证弹窗打开
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('新增客户')).toBeVisible();
    
    // 填写表单
    await modal.getByLabel('姓名').fill('测试客户_自动化');
    await modal.getByLabel('电话').fill('13900139000');
    await modal.getByLabel('邮箱').fill('test@example.com');
    
    // 提交表单
    await modal.getByRole('button', { name: '确定' }).click();
    
    // 验证成功消息和弹窗关闭
    await expect(page.getByText('创建成功')).toBeVisible();
    await expect(modal).not.toBeVisible();
    
    // 验证新客户出现在表格中
    await expect(page.getByText('测试客户_自动化')).toBeVisible();
    await expect(page.getByText('13900139000')).toBeVisible();
  });

  test('name field is required', async ({ page }) => {
    // 打开新增客户弹窗
    await page.getByRole('button', { name: /新增客户/ }).click();
    
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    
    // 只填写可选字段，不填姓名
    await modal.getByLabel('电话').fill('13800138000');
    
    // 尝试提交
    await modal.getByRole('button', { name: '确定' }).click();
    
    // 验证错误提示
    await expect(modal.getByText('请输入姓名')).toBeVisible();
    
    // 弹窗应该仍然打开
    await expect(modal).toBeVisible();
  });

  test('edit existing customer', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.ant-table-tbody tr', { timeout: 5000 });
    
    // 获取第一行的编辑按钮
    const firstEditButton = page.getByRole('button', { name: /编辑/ }).first();
    
    // 获取原始数据（用于验证）
    const firstRow = page.locator('.ant-table-tbody tr').first();
    const originalName = await firstRow.locator('td').nth(0).textContent();
    
    // 点击编辑
    await firstEditButton.click();
    
    // 验证编辑弹窗打开并有数据回填
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('编辑客户')).toBeVisible();
    
    const nameInput = modal.getByLabel('姓名');
    await expect(nameInput).toHaveValue(originalName || '');
    
    // 修改姓名
    await nameInput.fill('测试客户_已编辑');
    
    // 提交
    await modal.getByRole('button', { name: '确定' }).click();
    
    // 验证成功消息
    await expect(page.getByText('更新成功')).toBeVisible();
    await expect(modal).not.toBeVisible();
    
    // 验证表格中的数据已更新
    await expect(page.getByText('测试客户_已编辑')).toBeVisible();
  });

  test('cancel button closes modal without saving', async ({ page }) => {
    // 打开新增客户弹窗
    await page.getByRole('button', { name: /新增客户/ }).click();
    
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    
    // 填写一些数据
    await modal.getByLabel('姓名').fill('临时客户_不保存');
    await modal.getByLabel('电话').fill('13700137000');
    
    // 点击取消
    await modal.getByRole('button', { name: '取消' }).click();
    
    // 验证弹窗关闭
    await expect(modal).not.toBeVisible();
    
    // 验证数据未保存
    await expect(page.getByText('临时客户_不保存')).not.toBeVisible();
  });

  test('delete customer with confirmation', async ({ page }) => {
    // 先创建一个测试客户用于删除
    await page.getByRole('button', { name: /新增客户/ }).click();
    const modal = page.locator('.ant-modal');
    await modal.getByLabel('姓名').fill('测试客户_待删除');
    await modal.getByRole('button', { name: '确定' }).click();
    await expect(page.getByText('创建成功')).toBeVisible();
    
    // 找到刚创建的客户并点击删除
    const customerRow = page.locator('tr', { hasText: '测试客户_待删除' });
    await customerRow.getByRole('button', { name: /删除/ }).click();
    
    // 验证确认弹窗
    const popconfirm = page.locator('.ant-popconfirm');
    await expect(popconfirm).toBeVisible();
    await expect(popconfirm.getByText('确定要删除这个客户吗？')).toBeVisible();
    
    // 确认删除
    await popconfirm.getByRole('button', { name: '确定' }).click();
    
    // 验证成功消息
    await expect(page.getByText('删除成功')).toBeVisible();
    
    // 验证客户已从表格中移除
    await expect(page.getByText('测试客户_待删除')).not.toBeVisible();
  });

  test('cancel delete operation', async ({ page }) => {
    // 等待表格有数据
    await page.waitForSelector('.ant-table-tbody tr', { timeout: 5000 });
    
    // 获取第一个客户的名称
    const firstRow = page.locator('.ant-table-tbody tr').first();
    const customerName = await firstRow.locator('td').nth(0).textContent();
    
    // 点击删除按钮
    const deleteButton = firstRow.getByRole('button', { name: /删除/ });
    await deleteButton.click();
    
    // 验证确认弹窗
    const popconfirm = page.locator('.ant-popconfirm');
    await expect(popconfirm).toBeVisible();
    
    // 点击取消
    await popconfirm.getByRole('button', { name: '取消' }).click();
    
    // 验证客户仍然存在
    await expect(page.getByText(customerName || '')).toBeVisible();
  });

  test('modal closes when clicking X button', async ({ page }) => {
    // 打开新增客户弹窗
    await page.getByRole('button', { name: /新增客户/ }).click();
    
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    
    // 点击X关闭按钮
    await modal.locator('.ant-modal-close').click();
    
    // 验证弹窗关闭
    await expect(modal).not.toBeVisible();
  });

  test('customer table displays correctly', async ({ page }) => {
    // 验证表格列标题
    const headers = ['姓名', '电话', '邮箱', '创建时间', '操作'];
    
    for (const header of headers) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
    }
    
    // 如果有数据，验证每行都有操作按钮
    const rows = await page.locator('.ant-table-tbody tr').count();
    if (rows > 0) {
      const editButtons = await page.getByRole('button', { name: /编辑/ }).count();
      const deleteButtons = await page.getByRole('button', { name: /删除/ }).count();
      
      expect(editButtons).toBeGreaterThan(0);
      expect(deleteButtons).toBeGreaterThan(0);
    }
  });
});


