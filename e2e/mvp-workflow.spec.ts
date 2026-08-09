import type { Page } from '@playwright/test';

import { collectIstanbulCoverage, enableIstanbulCoverage, expect, test } from './coverage-fixture';

const password = 'playwright-password-123';

test('registration, team, terms, invitation, and bingo work end to end', async ({ browser, page: ownerPage }) => {
  test.setTimeout(180_000);
  const runId = `${Date.now()}-${test.info().project.name}`;
  const teamName = `Playwright Team ${runId}`;
  const guestContext = await browser.newContext();
  await enableIstanbulCoverage(guestContext);

  try {
    await signUp(ownerPage, {
      email: `owner-${runId}@example.test`,
      name: 'Owner Playwright',
    });

    await ownerPage.getByRole('link', { name: 'Teams' }).click();
    await ownerPage.getByLabel('Team name').fill(teamName);
    await ownerPage.getByRole('button', { name: 'Create team' }).click();
    await expect(ownerPage.getByRole('heading', { level: 1, name: teamName })).toBeVisible();
    await ownerPage.getByRole('link', { name: 'Manage terms' }).click();

    const termInput = ownerPage.getByLabel('New bingo term');
    for (let index = 1; index <= 25; index += 1) {
      await termInput.fill(`Meeting-Klassiker ${index}`);
      await ownerPage.getByRole('button', { name: 'Add' }).click();
      await expect(termInput).toHaveValue('');
    }
    await expect(ownerPage.getByText('25 / 25')).toBeVisible();

    await ownerPage.getByRole('link', { name: 'Back to team' }).click();
    await ownerPage.getByRole('link', { name: 'Manage invitations' }).click();
    await ownerPage.getByRole('button', { name: 'Create invitation link' }).click();
    const invitationLink = await ownerPage
      .locator('p')
      .filter({ hasText: 'http://localhost:5173/invite/' })
      .textContent();
    expect(invitationLink).toBeTruthy();
    await ownerPage.getByRole('link', { name: 'Back to team' }).click();

    const guestPage = await guestContext.newPage();
    await guestPage.goto(invitationLink!);
    await expect(guestPage.getByText(`Invitation to ${teamName}`, { exact: true })).toBeVisible();
    await guestPage.getByRole('link', { name: 'Sign in and join' }).click();
    await selectRegistrationMode(guestPage);
    await fillRegistration(guestPage, {
      email: `guest-${runId}@example.test`,
      name: 'Guest Playwright',
    });

    await expect(guestPage.getByText(`Invitation to ${teamName}`, { exact: true })).toBeVisible();
    await guestPage.getByRole('button', { name: 'Join as Guest Playwright' }).click();
    await expect(guestPage.getByRole('heading', { level: 1, name: teamName })).toBeVisible();
    await expect(guestPage.getByText('2 members')).toBeVisible();

    await ownerPage.reload();
    await expect(ownerPage.getByText('2 members')).toBeVisible();
    await ownerPage.getByRole('link', { name: 'Start bingo' }).click();
    const card = ownerPage.getByRole('group', { name: 'Bingo card' });
    const createCardButton = ownerPage.getByRole('button', { name: 'Shuffle card' });
    await expect(async () => {
      await createCardButton.click();
      expect((await createCardButton.isDisabled()) || (await card.isVisible())).toBe(true);
    }).toPass({ timeout: 10_000 });
    await expect(card).toBeVisible();

    for (let position = 0; position < 5; position += 1) {
      const cell = card.getByRole('button').nth(position);
      await cell.click();
      await expect(cell).toHaveAttribute('aria-pressed', 'true');
    }
    await expect(ownerPage.getByRole('heading', { level: 1, name: 'Bingo!' })).toBeVisible();
  } finally {
    await collectIstanbulCoverage(guestContext);
    await guestContext.close().catch(() => undefined);
  }
});

async function signUp(page: Page, user: { email: string; name: string }) {
  await page.goto('/auth');
  await selectRegistrationMode(page);
  await fillRegistration(page, user);
  await expect(page).toHaveURL('/');
}

async function selectRegistrationMode(page: Page) {
  await expect(async () => {
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.getByLabel('Name')).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
}

async function fillRegistration(page: Page, user: { email: string; name: string }) {
  await page.getByLabel('Name').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.locator('form').getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
}
