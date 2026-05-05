import { test, expect } from "@playwright/test";

test.describe("Welcome page", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
    });

    test("displays the app title", async ({ page }) => {
        await expect(page.getByRole("heading", { name: /milc app/i })).toBeVisible();
    });

    test("displays the subtitle", async ({ page }) => {
        await expect(
            page.getByText(/your guide to healthy goat milk/i),
        ).toBeVisible();
    });

    test("displays the goat logo image", async ({ page }) => {
        await expect(page.getByAltText(/milc goat logo/i)).toBeVisible();
    });

    test("displays the Start button", async ({ page }) => {
        await expect(page.getByRole("button", { name: /start/i })).toBeVisible();
    });

    test("Start button navigates to /login when unauthenticated", async ({
        page,
    }) => {
        await page.getByRole("button", { name: /start/i }).click();
        await expect(page).toHaveURL(/\/login/);
    });
});
