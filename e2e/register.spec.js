import { test, expect } from "@playwright/test";

test.describe("Register page — layout", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/register");
    });

    test("displays the Register heading", async ({ page }) => {
        await expect(
            page.getByRole("heading", { name: /register/i }),
        ).toBeVisible();
    });

    test("displays all required fields", async ({ page }) => {
        await expect(page.getByPlaceholder("Name")).toBeVisible();
        await expect(page.getByPlaceholder("Location")).toBeVisible();
        await expect(
            page.getByPlaceholder("Health Card (Carnet Sanitario)"),
        ).toBeVisible();
        await expect(page.getByPlaceholder("Email")).toBeVisible();
        await expect(page.getByPlaceholder("Password").first()).toBeVisible();
        await expect(page.getByPlaceholder("Confirm Password")).toBeVisible();
    });

    test("displays the Create Account submit button", async ({ page }) => {
        await expect(
            page.getByRole("button", { name: /create account/i }),
        ).toBeVisible();
    });

    test("displays the Back to Login link", async ({ page }) => {
        await expect(
            page.getByRole("button", { name: /back to login/i }),
        ).toBeVisible();
    });
});

test.describe("Register page — validation", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/register");
    });

    test("shows password mismatch error when passwords differ", async ({
        page,
    }) => {
        await page.getByPlaceholder("Name").fill("Test User");
        await page.getByPlaceholder("Location").fill("Test City");
        await page
            .getByPlaceholder("Health Card (Carnet Sanitario)")
            .fill("HC-001");
        await page.getByPlaceholder("Email").fill("new@example.com");
        await page.getByPlaceholder("Password").first().fill("password123");
        await page.getByPlaceholder("Confirm Password").fill("different456");
        await page.getByRole("button", { name: /create account/i }).click();
        await expect(
            page.getByText(/passwords do not match/i),
        ).toBeVisible();
    });
});

test.describe("Register page — navigation", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/register");
    });

    test("Back to Login button navigates to /login", async ({ page }) => {
        await page.getByRole("button", { name: /back to login/i }).click();
        await expect(page).toHaveURL(/\/login/);
    });
});
