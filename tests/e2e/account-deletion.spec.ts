import { expect, test } from "@playwright/test";

test("public privacy summary describes account deletion", async ({ page }) => {
  await page.goto("/privacy", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Deletion", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("password reauthentication", { exact: false }),
  ).toBeVisible();
});

test("invalid deletion receipt exposes no account information", async ({
  page,
}) => {
  await page.goto("/account-deletion-status");
  await expect(
    page.getByRole("heading", { name: "Status receipt unavailable." }),
  ).toBeVisible();
  await expect(page.getByText("email address", { exact: false })).toHaveCount(
    0,
  );
});
