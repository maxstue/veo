import { expect, test, type Page } from "@playwright/test";

const password = "playwright-password-123";

test("registration, team, terms, invitation, and bingo work end to end", async ({
  browser,
  page: ownerPage,
}) => {
  test.setTimeout(180_000);
  const runId = `${Date.now()}-${test.info().project.name}`;
  const teamName = `Playwright Team ${runId}`;
  const guestContext = await browser.newContext();

  try {
    await signUp(ownerPage, {
      email: `owner-${runId}@example.test`,
      name: "Owner Playwright",
    });

    await ownerPage.getByRole("link", { name: "Teams" }).click();
    await ownerPage.getByLabel("Teamname").fill(teamName);
    await ownerPage.getByRole("button", { name: "Team erstellen" }).click();
    await expect(ownerPage.getByRole("heading", { level: 1, name: teamName })).toBeVisible();

    const termInput = ownerPage.getByLabel("Neuer Bingo-Begriff");
    for (let index = 1; index <= 25; index += 1) {
      await termInput.fill(`Meeting-Klassiker ${index}`);
      await ownerPage.getByRole("button", { name: "Hinzufügen" }).click();
      await expect(termInput).toHaveValue("");
    }
    await expect(ownerPage.getByText("25 / 25")).toBeVisible();

    await ownerPage.getByRole("button", { name: "Einladungslink erstellen" }).click();
    const invitationLink = await ownerPage
      .locator("p")
      .filter({ hasText: "http://localhost:5173/invite/" })
      .textContent();
    expect(invitationLink).toBeTruthy();

    const guestPage = await guestContext.newPage();
    await guestPage.goto(invitationLink!);
    await expect(guestPage.getByText(`Einladung zu ${teamName}`, { exact: true })).toBeVisible();
    await guestPage.getByRole("link", { name: "Anmelden und beitreten" }).click();
    await selectRegistrationMode(guestPage);
    await fillRegistration(guestPage, {
      email: `guest-${runId}@example.test`,
      name: "Guest Playwright",
    });

    await expect(guestPage.getByText(`Einladung zu ${teamName}`, { exact: true })).toBeVisible();
    await guestPage.getByRole("button", { name: "Als Guest Playwright beitreten" }).click();
    await expect(guestPage.getByRole("heading", { level: 1, name: teamName })).toBeVisible();
    await expect(guestPage.getByText("2 Mitglieder")).toBeVisible();

    await ownerPage.reload();
    await expect(ownerPage.getByText("2 Mitglieder")).toBeVisible();
    await ownerPage.getByRole("link", { name: "Bingo spielen" }).click();
    const card = ownerPage.getByRole("group", { name: "Bingo-Karte" });
    const createCardButton = ownerPage.getByRole("button", { name: "Karte mischen" });
    await expect(async () => {
      await createCardButton.click();
      expect((await createCardButton.isDisabled()) || (await card.isVisible())).toBe(true);
    }).toPass({ timeout: 10_000 });
    await expect(card).toBeVisible();

    for (let position = 0; position < 5; position += 1) {
      const cell = card.getByRole("button").nth(position);
      await cell.click();
      await expect(cell).toHaveAttribute("aria-pressed", "true");
    }
    await expect(ownerPage.getByRole("heading", { level: 1, name: "Bingo!" })).toBeVisible();
  } finally {
    await guestContext.close().catch(() => undefined);
  }
});

async function signUp(page: Page, user: { email: string; name: string }) {
  await page.goto("/auth");
  await selectRegistrationMode(page);
  await fillRegistration(page, user);
  await expect(page).toHaveURL("/");
}

async function selectRegistrationMode(page: Page) {
  await expect(async () => {
    await page.getByRole("button", { name: "Registrieren" }).click();
    await expect(page.getByLabel("Name")).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
}

async function fillRegistration(page: Page, user: { email: string; name: string }) {
  await page.getByLabel("Name").fill(user.name);
  await page.getByLabel("E-Mail").fill(user.email);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Konto erstellen" }).click();
}
