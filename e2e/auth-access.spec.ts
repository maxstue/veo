import { expect, test } from './coverage-fixture';

test('signed-out viewers are redirected from protected team routes', async ({ page }) => {
  await page.goto('/teams');

  await expect(page).toHaveURL(/\/auth\?returnTo=%2Fteams/);
  await expect(page.getByText('Welcome back', { exact: true })).toBeVisible();
});

test('returns failed social sign-ins to the auth page and explains them', async ({ page }) => {
  await page.goto('/auth?returnTo=%2Fteams');
  let body: unknown;
  await page.route('**/api/auth/sign-in/social', async (route) => {
    body = route.request().postDataJSON();
    await route.abort();
  });
  // Retry the click until hydration has attached the handler.
  await expect(async () => {
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    expect(body).toMatchObject({ errorCallbackURL: '/auth?returnTo=%2Fteams' });
  }).toPass({ timeout: 10_000 });

  await page.goto('/auth?returnTo=%2Fteams&error=account_not_linked');
  await expect(page.getByRole('alert')).toContainText('already has a Veo account with another sign-in method');
});
