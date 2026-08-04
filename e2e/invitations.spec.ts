import { expect, test } from "@playwright/test";

test("invalid invitation links show a useful recovery path", async ({ page }) => {
  await page.goto(`/invite/${"invalid-token".padEnd(40, "0")}`);

  await expect(page.getByText("Einladung nicht verfügbar", { exact: true })).toBeVisible();
  await expect(page.getByText("Der Link ist ungültig.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Zur Startseite" })).toBeVisible();
});
