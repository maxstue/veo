import { expect, test } from "@playwright/test";

test("invalid invitation links show a useful recovery path", async ({ page }) => {
  await page.goto(`/invite/${"invalid-token".padEnd(40, "0")}`);

  await expect(page.getByText("Invitation unavailable", { exact: true })).toBeVisible();
  await expect(page.getByText("This link is invalid.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to home page" })).toBeVisible();
});
