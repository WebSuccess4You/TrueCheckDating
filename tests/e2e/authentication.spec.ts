import { expect, test } from "@playwright/test";

test("registration requires adult, terms, and privacy consent", async ({
  page,
}) => {
  await page.goto("/signup", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Create your private TrueCheckDating.com account.",
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel("I confirm that I am at least 18 years old."),
  ).toBeVisible();
  await expect(page.getByLabel(/I accept the Terms of Service/)).toBeVisible();
  await expect(page.getByLabel(/I accept the Privacy Policy/)).toBeVisible();
});

test("login includes secure recovery and private-account messaging", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Forgot your password?" }),
  ).toHaveAttribute("href", "/forgot-password");
  await expect(
    page.getByText("public case pages", { exact: false }),
  ).toBeVisible();
});

test("protected dashboard redirects an unauthenticated visitor", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByText("Please log in to open your private account."),
  ).toBeVisible();
});

test("authentication pages fit a phone viewport", async ({ page }) => {
  for (const path of ["/login", "/signup", "/forgot-password"]) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }
});
