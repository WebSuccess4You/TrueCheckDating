import { expect, test } from "@playwright/test";

test("public responses include baseline security headers", async ({
  request,
}) => {
  for (const path of ["/", "/privacy", "/login"]) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(response.headers()["permissions-policy"]).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
    const contentSecurityPolicy = response.headers()["content-security-policy"];
    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toContain("object-src 'none'");
    expect(
      response.headers()["content-security-policy-report-only"],
    ).toBeUndefined();
  }
});

test("CSP blocks an unapproved external connection", async ({ page }) => {
  await page.goto("/");
  const violation = await page.evaluate(async () => {
    const blockedUrl = "https://csp-blocked.example.invalid/probe";
    const violationEvent = new Promise<{
      directive: string;
      disposition: string;
    }>((resolve) => {
      const onViolation = (event: SecurityPolicyViolationEvent) => {
        if (event.blockedURI !== blockedUrl) return;
        document.removeEventListener("securitypolicyviolation", onViolation);
        resolve({
          directive: event.effectiveDirective,
          disposition: event.disposition,
        });
      };
      document.addEventListener("securitypolicyviolation", onViolation);
    });
    await fetch(blockedUrl).catch(() => undefined);
    return violationEvent;
  });
  expect(violation).toEqual({
    directive: "connect-src",
    disposition: "enforce",
  });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("landing page presents the approved product promise", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Pause before money, travel, or a major commitment.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Private by design", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Scores are risk indicators, not proof", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Start a private check" }).first(),
  ).toBeVisible();
});

test("primary navigation reaches public pages", async ({ page, isMobile }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const navigation = page.getByRole("navigation", {
    name: "Primary navigation",
  });

  async function openMenu() {
    if (isMobile) {
      const toggle = page.getByRole("button", {
        name: "Toggle navigation",
      });

      if ((await toggle.getAttribute("aria-expanded")) !== "true") {
        await toggle.click();
      }
    }

    await expect(navigation).toBeVisible();
  }

  await openMenu();
  await navigation
    .getByRole("link", { name: "How it works", exact: true })
    .click();

  await expect(page).toHaveURL(/\/how-it-works$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "One structured review instead of scattered clues.",
    }),
  ).toBeVisible();

  await openMenu();
  await navigation.getByRole("link", { name: "Pricing", exact: true }).click();

  await expect(page).toHaveURL(/\/pricing$/, { timeout: 15000 });
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Begin free. Pay for the depth you need.",
    }),
  ).toBeVisible();
});

test("mobile navigation is keyboard and touch accessible", async ({
  page,
  isMobile,
}) => {
  test.skip(
    !isMobile,
    "Mobile navigation behavior is tested in phone projects.",
  );

  await page.goto("/");
  const menu = page.getByRole("button", { name: "Toggle navigation" });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeVisible();
});

test("public pages do not overflow a phone viewport", async ({ page }) => {
  for (const path of [
    "/",
    "/how-it-works",
    "/pricing",
    "/privacy",
    "/terms",
    "/login",
    "/signup",
  ]) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(
      dimensions.scrollWidth,
      `${path} should not overflow`,
    ).toBeLessThanOrEqual(dimensions.clientWidth);
  }
});

test("skip link reaches the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});
