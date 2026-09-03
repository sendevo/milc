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
            page.getByRole("heading", { name: /my profile|mi perfil/i }),
        ).toBeVisible();
    });

    test("displays the Personal info section", async ({ page }) => {
        await expect(page.getByText(/personal info|datos personales/i)).toBeVisible();
    });

    test("displays the Save profile button", async ({ page }) => {
        await expect(
            page.getByRole("button", { name: /save profile|guardar perfil/i }),
        ).toBeVisible();
    });

    test("displays the Change password section", async ({ page }) => {
        await expect(page.getByText(/change password|cambiar contrase/i)).toBeVisible();
        await expect(
            page.locator('input[type="password"]').first(),
        ).toBeVisible();
        await expect(page.locator('input[type="password"]').nth(1)).toBeVisible();
    });

    test("displays the Update password button", async ({ page }) => {
        await expect(
            page.getByRole("button", { name: /update password|actualizar contrase/i }),
        ).toBeVisible();
    });

    test("back button returns to /app", async ({ page }) => {
        await page.locator('button:has(svg[data-testid="ArrowBackIosNewIcon"])').click();
        await expect(page).toHaveURL(/\/(home|app)$/);
    });

    test("shows effective herd size after registering dead animals", async ({ page }) => {
        await page.goto("/survey/view-220");
        await page.locator('input[type="text"]').first().fill("100");
        await page.getByRole("button", { name: /save|guardar|registrar/i }).click();

        await page.goto("/survey/view-177");
        await page.getByRole("button", { name: /dead animals|animales muertos/i }).click();
        await expect(page).toHaveURL(/\/survey\/view-dead-animals/);

        await page.locator('input[type="text"]').first().fill("10");
        await page.getByRole("button", { name: /save|guardar|registrar/i }).click();
        await expect(page).toHaveURL(/\/survey\/view-177/);

        await page.goto("/profile");
        await expect(page.getByText(/number of animals|cantidad de animales/i)).toBeVisible();
        await expect(page.getByText("90", { exact: true })).toBeVisible();
    });
});
