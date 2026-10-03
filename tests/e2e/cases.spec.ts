import { expect, test } from "@playwright/test";

test("new-case page redirects an unauthenticated visitor", async ({ page }) => {
  await page.goto("/cases/new");
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByText("Please log in to open your private account."),
  ).toBeVisible();
});

test("case overview redirects an unauthenticated visitor", async ({ page }) => {
  await page.goto("/cases/00000000-0000-4000-8000-000000000001");
  await expect(page).toHaveURL(/\/login/);
});

test("the login redirect preserves the requested case path", async ({
  page,
}) => {
  await page.goto("/cases/new");
  const url = new URL(page.url());
  expect(url.searchParams.get("next")).toBe("/cases/new");
});

test("chat submission page redirects an unauthenticated visitor", async ({
  page,
}) => {
  await page.goto("/cases/00000000-0000-4000-8000-000000000001/chat");
  await expect(page).toHaveURL(/\/login/);
});

test("saved chat submission redirects an unauthenticated visitor", async ({
  page,
}) => {
  await page.goto(
    "/cases/00000000-0000-4000-8000-000000000001/chat/00000000-0000-4000-8000-000000000002",
  );
  await expect(page).toHaveURL(/\/login/);
});

test("guided image check redirects an unauthenticated visitor", async ({
  page,
}) => {
  await page.goto("/cases/00000000-0000-4000-8000-000000000001/image");
  await expect(page).toHaveURL(/\/login/);
});

test("video verifier redirects an unauthenticated visitor", async ({
  page,
}) => {
  await page.goto("/cases/00000000-0000-4000-8000-000000000001/video");
  await expect(page).toHaveURL(/\/login/);
});
