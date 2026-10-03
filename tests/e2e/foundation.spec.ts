import { expect, test } from "@playwright/test";

test("loads the TrueCheckDating.com public site", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/TrueCheckDating\.com/);
  await expect(page.getByLabel("TrueCheckDating.com home")).toBeVisible();
  await expect(page.locator("main#main-content")).toBeVisible();
});
