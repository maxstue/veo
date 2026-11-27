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
  const remember = page.getByRole('button', { name: 'Remember sign-in method on this browser' });
  const form = page.locator('form');
  const signIn = form.getByRole('button', { name: 'Sign in' });
  await expect(remember).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText('Last used', { exact: true })).toHaveCount(0);
  await expect(async () => {
    await remember.click();
    await expect(remember).toHaveAttribute('aria-pressed', 'true', { timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Password', { exact: true }).fill(`${password}-wrong`);
  await signIn.click();
  await expect(form.getByRole('alert')).toBeVisible();
  expect((await preferences())?.value).toBe('pending');
  await expect(page.getByText('Last used', { exact: true })).toHaveCount(0);

  await form.getByLabel('Password', { exact: true }).fill(password);
  await signIn.click();
  await expect(page).toHaveURL('/');
  expect((await preferences())?.value).toBe('email');

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.goto('/auth');
  await expect(signIn.getByText('Last used')).toBeVisible();
  await remember.click();
  await expect(remember).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText('Last used', { exact: true })).toHaveCount(0);
  expect(await preferences()).toBeUndefined();

  await remember.click();
  await expect(remember).toHaveAttribute('aria-pressed', 'true');
  let releaseResponse!: () => void;
  const responseReady = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route('**/api/auth/sign-in/email', async (route) => {
    const headers = await route.request().allHeaders();
    await responseReady;
    await route.fulfill({ response: await route.fetch({ headers }) });
  });

  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Password', { exact: true }).fill(password);
  const signInRequest = page.waitForRequest('**/api/auth/sign-in/email');
  await signIn.click();
  try {
    expect(await (await signInRequest).headerValue('cookie')).toContain('veo.last_login_method=pending');
    await remember.click();
    await expect(remember).toHaveAttribute('aria-pressed', 'false');
  } finally {
    releaseResponse();
  }
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

test('remembers the provider when an authenticated OAuth callback returns to Veo', async ({ page, context }) => {
  const email = `oauth-callback-${Date.now()}-${test.info().project.name}@example.test`;
  const origin = 'http://localhost:5173';
  const signup = await context.request.post('/api/auth/sign-up/email', {
    headers: { origin },
    data: { email, name: 'OAuth Callback Playwright', password: 'playwright-password-123' },
  });
  expect(signup.ok()).toBe(true);

  await page.goto('/auth?returnTo=%2Faccount');
  const remember = page.getByRole('button', { name: 'Remember sign-in method on this browser' });
  await expect(async () => {
    await remember.click();
    await expect(remember).toHaveAttribute('aria-pressed', 'true', { timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
  await page.route('**/api/auth/sign-in/social', async (route) => {
    const request = route.request().postDataJSON() as { callbackURL: string };
    await route.fulfill({ json: { redirect: true, url: request.callbackURL } });
  });
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page).toHaveURL('/account');

  await page.goto('/auth');
  await expect(page.getByRole('button', { name: 'Continue with Google' }).getByText('Last used')).toBeVisible();
});
