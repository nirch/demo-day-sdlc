import { test, expect } from '@playwright/test';

// Credentials come from server/src/seeders/20260323000001-admin-user.js
const ADMIN = { email: 'admin@demoday.com', password: 'Admin123!' };

test('seeded admin logs in and lands on the event list', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in to Demo Day' })).toBeVisible();

  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Password').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible();
});
