import { test, expect } from "@playwright/test";

/**
 * These tests verify that protected routes redirect unauthenticated users to
 * /login with a `replace` history entry (so they cannot go "back" into the
 * protected page).
 */

const PROTECTED_ROUTES = [
    "/app",
    "/config",
    "/info",
    "/profile",
    "/survey/before-milking-start",
];

for (const route of PROTECTED_ROUTES) {
    test(`unauthenticated access to ${route} redirects to /login`, async ({
        page,
    }) => {
        await page.goto(route);
        await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
    });
}

test("root / renders the Welcome page (public)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /milc app/i })).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
});

test("unauthenticated user cannot navigate back to /app after redirect", async ({
    page,
}) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login/);
    // History replace means going back lands on Welcome (or wherever before /app)
    await page.goBack();
    await expect(page).not.toHaveURL(/\/app/);
});
