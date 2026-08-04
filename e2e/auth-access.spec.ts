import { expect, test } from "@playwright/test";

test("signed-out viewers are redirected from protected team routes", async ({ page }) => {
  await page.goto("/teams");

  await expect(page).toHaveURL(/\/auth\?returnTo=%2Fteams/);
  await expect(page.getByText("Willkommen zurück", { exact: true })).toBeVisible();
});
