import { expect, test } from '@playwright/test';

test('privacy policy is linked from home and sign-in and explains every browser entry', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy', exact: true }).click();
  await expect(page).toHaveURL('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy policy', level: 1 })).toBeVisible();

  await page.goto('/auth');
  await page.getByRole('link', { name: 'How we use cookies' }).click();
  await expect(page).toHaveURL('/privacy#cookies');
  const cookies = page.locator('#cookies');
  for (const name of ['better-auth.session_token', 'veo.last_login_method', 'veo-theme']) {
    await expect(cookies.getByText(name, { exact: true })).toBeVisible();
  }
});
