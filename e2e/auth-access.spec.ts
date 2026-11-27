import { expect, test } from './coverage-fixture';

test('signed-out viewers are redirected from protected team routes', async ({ page }) => {
  await page.goto('/teams');

  await expect(page).toHaveURL(/\/auth\?returnTo=%2Fteams/);
  await expect(page.getByText('Welcome back', { exact: true })).toBeVisible();
});

test('remembers a successful sign-in only after opt-in and lets users clear it', async ({ page, context }) => {
  const email = `last-login-${Date.now()}-${test.info().project.name}@example.test`;
  const password = 'playwright-password-123';
  const preferences = () =>
    context.cookies().then((cookies) => cookies.find(({ name }) => name === 'veo.last_login_method'));

  await page.goto('/auth');
  await expect(async () => {
    await page.getByRole('button', { name: 'Sign up', exact: true }).click();
    await expect(page.getByLabel('Name')).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
  await page.getByLabel('Name').fill('Last Login Playwright');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page).toHaveURL('/');
  expect(await preferences()).toBeUndefined();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.goto('/auth');
  const remember = page.getByRole('checkbox', { name: 'Remember sign-in method on this browser for 30 days' });
  const form = page.locator('form');
  const signIn = form.getByRole('button', { name: 'Sign in' });
  await expect(remember).not.toBeChecked();
  await expect(page.getByText('Last used', { exact: true })).toHaveCount(0);
  await expect(async () => {
    await remember.click();
    await expect(remember).toBeChecked({ timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Password', { exact: true }).fill(`${password}-wrong`);
  await signIn.click();
  await expect(form.getByRole('alert')).toBeVisible();
  expect((await preferences())?.value).toBe('pending');
  await expect(page.getByText('Last used', { exact: true })).toHaveCount(0);

  let releaseResponse!: () => void;
  const responseReady = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route('**/api/auth/sign-in/email', async (route) => {
    await responseReady;
    await route.continue();
  });
  await form.getByLabel('Password', { exact: true }).fill(password);
  await signIn.click();
  try {
    await expect(remember).toBeDisabled();
  } finally {
    releaseResponse();
  }
  await expect(page).toHaveURL('/');
  expect((await preferences())?.value).toBe('email');

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.goto('/auth');
  await expect(signIn.getByText('Last used')).toBeVisible();
  await remember.click();
  await expect(remember).not.toBeChecked();
  await expect(page.getByText('Last used', { exact: true })).toHaveCount(0);
  expect(await preferences()).toBeUndefined();

  await page.unroute('**/api/auth/sign-in/email');
  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Password', { exact: true }).fill(password);
  await signIn.click();
  await expect(page).toHaveURL('/');
  expect(await preferences()).toBeUndefined();
});

test('marks a remembered social provider in both auth modes', async ({ page, context }) => {
  await context.addCookies([{ name: 'veo.last_login_method', value: 'microsoft', domain: 'localhost', path: '/' }]);
  await page.goto('/auth');
  const microsoftBadge = page.getByRole('button', { name: 'Continue with Microsoft' }).getByText('Last used');
  await expect(microsoftBadge).toBeVisible();
  await page.getByRole('button', { name: 'Sign up', exact: true }).click();
  await expect(page.getByLabel('Name')).toBeVisible();
  await expect(microsoftBadge).toBeVisible();
});
