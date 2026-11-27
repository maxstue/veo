import { expect, test } from './coverage-fixture';

test('signed-out viewers are redirected from protected team routes', async ({ page }) => {
  await page.goto('/teams');

  await expect(page).toHaveURL(/\/auth\?returnTo=%2Fteams/);
  await expect(page.getByText('Welcome back', { exact: true })).toBeVisible();
});

test('explains a social sign-in for an email that uses another sign-in method', async ({ page }) => {
  await page.goto('/auth?error=account_not_linked&returnTo=%2Fteams');
  await expect(page.getByRole('alert')).toContainText('already has a Veo account with another sign-in method');
});
