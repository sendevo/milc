import { test, expect } from "@playwright/test";
import { mockFirebaseAuth, loginTestUser } from "./helpers/firebase.js";

test.describe("Profile page", () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebaseAuth(page);
        await loginTestUser(page);
        await page.goto("/profile");
    });

    test("displays the My Profile heading", async ({ page }) => {
        await expect(
            page.getByRole("heading", { name: /my profile/i }),
        ).toBeVisible();
    });

    test("displays the Personal info section", async ({ page }) => {
        await expect(page.getByText(/personal info/i)).toBeVisible();
    });

    test("displays the Save profile button", async ({ page }) => {
        await expect(
            page.getByRole("button", { name: /save profile/i }),
        ).toBeVisible();
    });

    test("displays the Change password section", async ({ page }) => {
        await expect(page.getByText(/change password/i)).toBeVisible();
        await expect(
            page.getByPlaceholder("Current password"),
        ).toBeVisible();
        await expect(page.getByPlaceholder("New password")).toBeVisible();
    });

    test("displays the Update password button", async ({ page }) => {
        await expect(
            page.getByRole("button", { name: /update password/i }),
        ).toBeVisible();
    });

    test("back button returns to /app", async ({ page }) => {
        await page.locator('button:has(svg[data-testid="ArrowBackIosNewIcon"])').click();
        await expect(page).toHaveURL(/\/app/);
    });
});
