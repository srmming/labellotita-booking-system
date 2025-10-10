import { test, expect } from '@playwright/test';

test.describe('Page navigation and routing', () => {
  test('root path redirects to dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: '订单概览' })).toBeVisible();
  });

  test('all navigation menu links work correctly', async ({ page }) => {
    await page.goto('/dashboard');

    // 测试每个导航菜单项
    const menuItems = [
      { name: '订单概览', path: '/dashboard', heading: '订单概览' },
      { name: '订单管理', path: '/orders', heading: '订单管理' },
      { name: '产品管理', path: '/products', heading: '产品管理' },
      { name: '生产计划', path: '/production', heading: '生产计划' },
      { name: '客户管理', path: '/customers', heading: '客户管理' }
    ];

    for (const item of menuItems) {
      await page.getByRole('menuitem', { name: item.name }).click();
      await expect(page).toHaveURL(new RegExp(item.path));
      await expect(page.getByRole('heading', { name: item.heading })).toBeVisible();
    }
  });

  test('order list to detail navigation', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByRole('heading', { name: '订单管理' })).toBeVisible();

    // 如果表格有数据，点击查看详情
    const viewButtons = page.getByRole('button', { name: /查看详情/ });
    const count = await viewButtons.count();
    
    if (count > 0) {
      await viewButtons.first().click();
      
      // 验证跳转到订单详情页
      await expect(page).toHaveURL(/\/orders\/[a-f0-9]+/);
      await expect(page.getByText('订单信息')).toBeVisible();
      
      // 返回订单列表
      await page.getByRole('button', { name: /返回订单列表/ }).click();
      await expect(page).toHaveURL(/\/orders$/);
      await expect(page.getByRole('heading', { name: '订单管理' })).toBeVisible();
    }
  });

  test('new order form navigation and cancel', async ({ page }) => {
    await page.goto('/orders');
    
    // 点击新建订单
    await page.getByRole('button', { name: /新建订单/ }).click();
    await expect(page).toHaveURL(/\/orders\/new/);
    await expect(page.getByRole('heading', { name: '创建订单' })).toBeVisible();
    
    // 点击取消按钮返回
    await page.getByRole('button', { name: '取消' }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole('heading', { name: '订单管理' })).toBeVisible();
  });

  test('invalid order ID shows loading or error state', async ({ page }) => {
    // 访问不存在的订单ID
    await page.goto('/orders/000000000000000000000000');
    
    // 应该显示加载中或错误状态（根据实际实现）
    const loadingText = page.getByText('加载中');
    const errorMessage = page.getByText(/失败|错误|不存在/);
    
    // 至少其中一个应该可见
    const isLoadingVisible = await loadingText.isVisible().catch(() => false);
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);
    
    expect(isLoadingVisible || isErrorVisible).toBeTruthy();
  });

  test('navigation maintains selected menu item highlight', async ({ page }) => {
    await page.goto('/dashboard');
    
    // 导航到客户管理
    await page.getByRole('menuitem', { name: '客户管理' }).click();
    await expect(page).toHaveURL(/\/customers/);
    
    // 验证客户管理菜单项被选中（Ant Design的选中状态）
    const customersMenuItem = page.getByRole('menuitem', { name: '客户管理' });
    await expect(customersMenuItem).toHaveClass(/ant-menu-item-selected/);
  });

  test('direct URL access works for all routes', async ({ page }) => {
    const routes = [
      { path: '/dashboard', heading: '订单概览' },
      { path: '/orders', heading: '订单管理' },
      { path: '/products', heading: '产品管理' },
      { path: '/customers', heading: '客户管理' },
      { path: '/production', heading: '生产计划' },
      { path: '/orders/new', heading: '创建订单' }
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
      await expect(page).toHaveURL(new RegExp(route.path));
    }
  });
});


