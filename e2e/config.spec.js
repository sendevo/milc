import { test, expect } from "@playwright/test";
import { mockFirebaseAuth, loginTestUser } from "./helpers/firebase.js";

test.describe("Config / Settings page", () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebaseAuth(page);
        await loginTestUser(page);
        await page.goto("/config");
    });

    test("displays the Settings heading", async ({ page }) => {
        await expect(
            page.getByRole("heading", { name: /settings/i }),
        ).toBeVisible();
    });

    test("displays the Language selector", async ({ page }) => {
        await expect(page.getByText(/^language$/i)).toBeVisible();
    });

    test("displays the Theme selector", async ({ page }) => {
        await expect(page.getByText(/^theme$/i)).toBeVisible();
    });

    test("displays the Survey data / Reset & update button", async ({ page }) => {
        await expect(page.getByText(/survey data/i)).toBeVisible();
        await expect(
            page.getByRole("button", { name: /reset & update/i }),
        ).toBeVisible();
    });

    test("back button returns to /app", async ({ page }) => {
        await page.locator('button:has(svg[data-testid="ArrowBackIosNewIcon"])').click();
        await expect(page).toHaveURL(/\/app/);
    });

    test("can change language to Spanish", async ({ page }) => {
        // Open the Language select and choose Español
        const languageSelect = page.locator("[aria-label='Language']").or(
            page.locator("select").first(),
        );
        // Locate the MUI Select by its current value (English) and click it
        const langRow = page.getByText(/^language$/i).locator("..");
        await langRow.getByRole("combobox").click();
        await page.getByRole("option", { name: /español/i }).click();
        // After switching, the page should still render (no crash)
        await expect(page.getByRole("heading")).toBeVisible();
    });

    test("can toggle theme to Dark mode", async ({ page }) => {
        const themeRow = page.getByText(/^theme$/i).locator("..");
        await themeRow.getByRole("combobox").click();
        await page.getByRole("option", { name: /dark/i }).click();
        await expect(page.getByRole("heading")).toBeVisible();
    });
});
