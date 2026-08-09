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
  await expect(accountContent.locator('span').getByText(user.email, { exact: true })).toBeVisible();
  await expect(accountContent.getByText('Sign-in methods', { exact: true })).toBeVisible();
  await expect(accountContent.getByText('Email & password', { exact: true })).toBeVisible();
  await expect(accountContent.getByText('Connected', { exact: true })).toBeVisible();
  await expect(accountContent.getByRole('button', { name: 'Send reset link' })).toBeVisible();
});

test('users can permanently delete their account', async ({ page }) => {
  const runId = `${Date.now()}-${test.info().project.name}`;
  const user = {
    email: `delete-account-${runId}@example.test`,
    name: 'Delete Account Playwright',
  };

  await signUp(page, user);
  await page.getByRole('link', { name: 'Account' }).click();
  await page.getByRole('button', { name: 'Delete account' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Type DELETE to confirm').fill('DELETE');
  await page.getByRole('button', { name: 'Delete account permanently' }).click();

  await expect(page).toHaveURL('/auth');

  await page.goto('/account');
  await expect(page).toHaveURL(/\/auth\?returnTo=%2Faccount/);
});

test('users can change their password from the account page', async ({ page }) => {
  const runId = `${Date.now()}-${test.info().project.name}`;
  const newPassword = `${password}-updated`;
  const user = {
    email: `change-password-${runId}@example.test`,
    name: 'Change Password Playwright',
  };

  await signUp(page, user);
  await page.getByRole('link', { name: 'Account' }).click();
  await page.getByLabel('Current password').fill(password);
  await page.getByLabel('New password', { exact: true }).fill(newPassword);
  await page.getByLabel('Confirm new password').fill(newPassword);
  await page.getByRole('button', { name: 'Update password' }).click();

  await expect(page.getByRole('status')).toContainText('Your password has been updated.');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.goto('/auth');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(newPassword);
  await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/');
});

test('password reset entry points and invalid links are handled clearly', async ({ page }) => {
  await page.goto('/auth');
  await expect(async () => {
    await page.getByRole('button', { name: 'Forgot your password?', exact: true }).click();
    await expect(page.getByText('Reset your password', { exact: true })).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
  await page.getByLabel('Email').fill(`missing-${Date.now()}@example.test`);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByRole('status')).toContainText('If an account exists');

  await page.goto('/reset-password?error=INVALID_TOKEN');
  await expect(page.getByText('This reset link is invalid or has expired.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to sign in' })).toBeVisible();
});

async function signUp(page: Page, user: { email: string; name: string }) {
  await page.goto('/auth');
  await expect(async () => {
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.getByLabel('Name')).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
  await page.getByLabel('Name').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL('/');
}
