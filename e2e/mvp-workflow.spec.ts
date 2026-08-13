import type { Page } from '@playwright/test';

import { collectIstanbulCoverage, enableIstanbulCoverage, expect, test } from './coverage-fixture';

const password = 'playwright-password-123';

test('registration, session invitation, live bingo, and chat work end to end', async ({ browser, page: ownerPage }) => {
  test.setTimeout(180_000);
  const websocketErrors: string[] = [];
  ownerPage.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('WebSocket')) {
      websocketErrors.push(message.text());
    }
  });
  await ownerPage.addInitScript(() => {
    const originalPlay = Reflect.get(HTMLMediaElement.prototype, 'play') as () => Promise<void>;
    (window as unknown as { veoAudioPlayCount: number }).veoAudioPlayCount = 0;
    HTMLMediaElement.prototype.play = function play() {
      (window as unknown as { veoAudioPlayCount: number }).veoAudioPlayCount += 1;
      return Reflect.apply(originalPlay, this, []);
    };
  });
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
    await ownerPage.getByRole('button', { name: 'New session' }).click();
    await expect(ownerPage.getByRole('heading', { level: 1, name: 'Bingo session ready' })).toBeVisible();
    await ownerPage.getByRole('button', { name: 'Invitation link' }).click();
    const invitationLink = await ownerPage
      .locator('p')
      .filter({ hasText: 'http://localhost:5173/sessions/join/' })
      .textContent();
    expect(invitationLink).toBeTruthy();

    const guestPage = await guestContext.newPage();
    guestPage.on('console', (message) => {
      if (message.type() === 'error' && message.text().includes('WebSocket')) {
        websocketErrors.push(message.text());
      }
    });
    await guestPage.goto(invitationLink!);
    await expect(guestPage.getByText(`Join bingo with ${teamName}`, { exact: true })).toBeVisible();
    await guestPage.getByRole('link', { name: 'Sign in and join' }).click();
    await selectRegistrationMode(guestPage);
    await fillRegistration(guestPage, {
      email: `guest-${runId}@example.test`,
      name: 'Guest Playwright',
    });

    await expect(guestPage.getByText(`Join bingo with ${teamName}`, { exact: true })).toBeVisible();
    await guestPage.getByRole('button', { name: 'Join as Guest Playwright' }).click();
    await expect(guestPage.getByRole('heading', { level: 1, name: 'Bingo session ready' })).toBeVisible();
    await expect(ownerPage.getByText('2 online')).toBeVisible();
    await expect(ownerPage.getByText('Guest Playwright, Owner Playwright')).toBeVisible();

    await ownerPage.getByRole('button', { name: 'Start session' }).click();
    await expect(ownerPage.getByRole('heading', { level: 1, name: 'Live bingo' })).toBeVisible();
    await expect(guestPage.getByRole('heading', { level: 1, name: 'Live bingo' })).toBeVisible();
    await expect(guestPage.getByText('2 online')).toBeVisible();

    await guestPage.reload();
    await expect(guestPage.getByRole('heading', { level: 1, name: 'Live bingo' })).toBeVisible();
    await expect(guestPage.getByText('2 online')).toBeVisible();

    const card = ownerPage.getByRole('group', { name: 'Bingo card' });
    await expect(card).toBeVisible({ timeout: 10_000 });
    await expect(guestPage.getByRole('group', { name: 'Bingo card' })).toBeVisible({ timeout: 10_000 });

    for (let position = 0; position < 5; position += 1) {
      const cell = card.getByRole('button').nth(position);
      await cell.click();
      await expect(cell).toHaveAttribute('aria-pressed', 'true');
      await expect(guestPage.getByText(`${position + 1} / 5`, { exact: true })).toBeVisible();
    }
    await expect(ownerPage.getByText('Bingo!', { exact: true })).toBeVisible();
    await expect(ownerPage.getByTestId('bingo-confetti')).toBeVisible();
    await expect
      .poll(() => ownerPage.evaluate(() => (window as unknown as { veoAudioPlayCount: number }).veoAudioPlayCount))
      .toBe(1);
    await expect(guestPage.getByText('1. Owner Playwright', { exact: true })).toBeVisible();

    const chat = guestPage.getByLabel('Message');
    await expect(chat).toBeEnabled();
    await chat.fill('Good bingo');
    await guestPage.getByRole('button', { name: 'Send' }).click();
    await expect(ownerPage.getByText('Good bingo', { exact: true })).toBeVisible();

    await ownerPage.getByRole('button', { name: 'End session' }).click();
    await ownerPage.getByRole('dialog').getByRole('button', { name: 'End session' }).click();
    await expect(ownerPage.getByRole('heading', { level: 1, name: 'Bingo session ended' })).toBeVisible();
    await expect(guestPage.getByRole('heading', { level: 1, name: 'Bingo session ended' })).toBeVisible();
    expect(websocketErrors).toEqual([]);
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
