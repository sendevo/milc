import { test, expect } from "@playwright/test";
import { mockFirebaseAuth, TEST_USER, loginTestUser } from "./helpers/firebase.js";

test.describe("Login page — layout", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/login");
    });

    test("displays the Login heading", async ({ page }) => {
        await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
    });

    test("displays email and password fields", async ({ page }) => {
        await expect(page.getByPlaceholder("Email")).toBeVisible();
        await expect(page.getByPlaceholder("Password")).toBeVisible();
    });

    test("displays the Login submit button", async ({ page }) => {
        await expect(page.getByRole("button", { name: /^login$/i })).toBeVisible();
    });

    test("displays the Create an account link", async ({ page }) => {
        await expect(
            page.getByRole("button", { name: /create an account/i }),
        ).toBeVisible();
    });

    test("displays the Continue without account button", async ({ page }) => {
        await expect(
            page.getByRole("button", { name: /continue without account/i }),
        ).toBeVisible();
    });
});

test.describe("Login page — validation", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/login");
    });

    test("shows an error message when submitting wrong credentials", async ({
        page,
    }) => {
        // No route mock → Firebase returns an auth/invalid-credential error
        await page.getByPlaceholder("Email").fill("wrong@example.com");
        await page.getByPlaceholder("Password").fill("wrongpassword");
        await page.getByRole("button", { name: /^login$/i }).click();
        // The component sets error = t("login.error") on catch
        await expect(
            page.getByText(/login failed|please check your credentials/i),
        ).toBeVisible({ timeout: 10_000 });
    });
});

test.describe("Login page — navigation", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/login");
    });

    test("Create an account button navigates to /register", async ({ page }) => {
        await page.getByRole("button", { name: /create an account/i }).click();
        await expect(page).toHaveURL(/\/register/);
    });
});

test.describe("Login page — successful sign-in", () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebaseAuth(page);
    });

    test("redirects to /app after successful login", async ({ page }) => {
        await loginTestUser(page);
        await expect(page).toHaveURL(/\/app/);
    });

    test("already-authenticated user is redirected from /login to /app", async ({
        page,
    }) => {
        await loginTestUser(page);
        await page.goto("/login");
        await expect(page).toHaveURL(/\/app/);
    });
});
