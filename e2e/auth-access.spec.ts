import { expect, test } from "./coverage-fixture";

test("signed-out viewers are redirected from protected team routes", async ({ page }) => {
  await page.goto("/teams");

  await expect(page).toHaveURL(/\/auth\?returnTo=%2Fteams/);
  await expect(page.getByText("Welcome back", { exact: true })).toBeVisible();
});
