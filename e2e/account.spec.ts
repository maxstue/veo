import type { Page } from '@playwright/test';

import { expect, test } from './coverage-fixture';

const password = 'playwright-password-123';

test('signed-out viewers are redirected from the account page', async ({ page }) => {
  await page.goto('/account');

  await expect(page).toHaveURL(/\/auth\?returnTo=%2Faccount/);
  await expect(page.getByText('Welcome back', { exact: true })).toBeVisible();
});

test('users can view their profile and connected email sign-in method', async ({ page }) => {
  const runId = `${Date.now()}-${test.info().project.name}`;
  const user = {
    email: `account-${runId}@example.test`,
    name: 'Account Playwright',
  };

  await signUp(page, user);
  await page.getByRole('link', { name: 'Account' }).click();

  const accountContent = page.locator('main > section');

  await expect(page).toHaveURL('/account');
  await expect(accountContent.getByRole('heading', { level: 1, name: 'Account' })).toBeVisible();
  await expect(accountContent.getByText(user.name, { exact: true })).toBeVisible();
  await expect(accountContent.getByText(user.email, { exact: true })).toBeVisible();
  await expect(accountContent.getByText('Sign-in methods', { exact: true })).toBeVisible();
  await expect(accountContent.getByText('Email & password', { exact: true })).toBeVisible();
  await expect(accountContent.getByText('Connected', { exact: true })).toBeVisible();
});

async function signUp(page: Page, user: { email: string; name: string }) {
  await page.goto('/auth');
  await expect(async () => {
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.getByLabel('Name')).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
  await page.getByLabel('Name').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL('/');
}
