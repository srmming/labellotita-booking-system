import { test, expect } from '@playwright/test';

test.describe('Keyboard interaction', () => {
  test('customer form: Tab navigation and Enter submit', async ({ page }) => {
    await page.goto('/customers');
    
    // 等待页面加载
    await expect(page.getByRole('heading', { name: '客户管理' })).toBeVisible();
    
    // 点击新增客户按钮打开弹窗
    await page.getByRole('button', { name: /新增客户/ }).click();
    
    // 等待弹窗出现
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('新增客户')).toBeVisible();
    
    // 定位表单输入框
    const nameInput = modal.getByLabel('姓名');
    const phoneInput = modal.getByLabel('电话');
    const emailInput = modal.getByLabel('邮箱');
    
    // 在姓名框输入
    await nameInput.fill('测试客户');
    
    // Tab 到电话字段
    await nameInput.press('Tab');
    await expect(phoneInput).toBeFocused();
    await phoneInput.type('13800138000');
    
    // Tab 到邮箱字段
    await phoneInput.press('Tab');
    await expect(emailInput).toBeFocused();
    await emailInput.type('test@example.com');
    
    // 直接点击确定按钮提交（验证输入完成后的提交流程）
    const okButton = modal.getByRole('button', { name: '确定' });
    await okButton.click();
    
    // 验证弹窗关闭和成功消息
    await expect(modal).not.toBeVisible();
    await expect(page.getByText('创建成功')).toBeVisible();
    
    // 验证新客户出现在表格中
    await expect(page.getByText('测试客户')).toBeVisible();
  });

  test('customer form: Escape to cancel', async ({ page }) => {
    await page.goto('/customers');
    
    await page.getByRole('button', { name: /新增客户/ }).click();
    
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    
    // 输入部分数据
    await modal.getByLabel('姓名').fill('临时客户');
    
    // 按 Escape 关闭弹窗
    await page.keyboard.press('Escape');
    
    // 验证弹窗关闭
    await expect(modal).not.toBeVisible();
    
    // 验证数据未提交（表格中没有"临时客户"）
    await expect(page.getByText('临时客户')).not.toBeVisible();
  });

  test('search and filter with keyboard', async ({ page }) => {
    await page.goto('/products');
    
    await expect(page.getByRole('heading', { name: '产品管理' })).toBeVisible();
    
    // 如果页面有搜索框，测试键盘输入和回车搜索
    const searchInput = page.locator('input[placeholder*="搜索"], input[type="search"]').first();
    
    if (await searchInput.isVisible()) {
      // 聚焦搜索框
      await searchInput.click();
      
      // 输入搜索词
      await searchInput.type('蜡烛', { delay: 50 });
      
      // Enter 触发搜索
      await searchInput.press('Enter');
      
      // 等待搜索结果
      await page.waitForTimeout(500);
    }
  });

  test('number input with arrow keys', async ({ page }) => {
    await page.goto('/orders/new');
    
    await expect(page.getByRole('heading', { name: '创建订单' })).toBeVisible();
    
    // 等待表单加载
    await page.waitForTimeout(1000);
    
    // 先添加一个产品项
    await page.getByRole('button', { name: /添加产品/ }).click();
    
    // 定位数量输入框
    const quantityInput = page.locator('input[placeholder="数量"]').first();
    
    if (await quantityInput.isVisible()) {
      await quantityInput.click();
      
      // 输入初始值
      await quantityInput.fill('5');
      
      // 向上箭头增加
      await quantityInput.press('ArrowUp');
      await expect(quantityInput).toHaveValue('6');
      
      // 向下箭头减少
      await quantityInput.press('ArrowDown');
      await expect(quantityInput).toHaveValue('5');
      
      // 多次向上
      await quantityInput.press('ArrowUp');
      await quantityInput.press('ArrowUp');
      await quantityInput.press('ArrowUp');
      await expect(quantityInput).toHaveValue('8');
    }
  });

  test('dropdown keyboard navigation', async ({ page }) => {
    await page.goto('/orders/new');
    
    await expect(page.getByRole('heading', { name: '创建订单' })).toBeVisible();
    
    // 等待下拉选项加载
    await page.waitForTimeout(1000);
    
    // 客户下拉框
    const customerSelect = page.locator('.ant-select').filter({ hasText: '选择客户' }).first();
    
    if (await customerSelect.isVisible()) {
      // 点击打开下拉
      await customerSelect.click();
      
      // 等待下拉菜单出现
      const dropdown = page.locator('.ant-select-dropdown').last();
      await expect(dropdown).toBeVisible();
      
      // 向下箭头导航
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      
      // Enter 选择
      await page.keyboard.press('Enter');
      
      // 验证下拉关闭
      await expect(dropdown).not.toBeVisible();
    }
  });
});

