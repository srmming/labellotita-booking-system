import { test, expect } from '@playwright/test';

const DASHBOARD_TITLE = '订单概览';

const STAT_CARDS = [
  '总订单数',
  '待处理',
  '出货中',
  '已完成'
];

const NAV_ITEMS = [
  ['订单概览', '/dashboard'],
  ['订单管理', '/orders'],
  ['产品管理', '/products'],
  ['生产计划', '/production'],
  ['客户管理', '/customers']
];

async function ensureRoute(testPage, targetPath) {
  await testPage.waitForURL(`**${targetPath}*`, { waitUntil: 'load' });
}

test.describe('Dashboard smoke', () => {
  test('loads dashboard and navigates', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: DASHBOARD_TITLE })).toBeVisible();

    for (const title of STAT_CARDS) {
      await expect(page.locator('.ant-statistic-title', { hasText: title }).first()).toBeVisible();
    }

    await expect(page.locator('.ant-card .ant-table')).toBeVisible();

    for (const [label, path] of NAV_ITEMS) {
      await page.getByRole('menuitem', { name: label }).click();
      await ensureRoute(page, path);
    }

    await page.getByRole('menuitem', { name: '订单概览' }).click();
    await ensureRoute(page, '/dashboard');
  });
});
