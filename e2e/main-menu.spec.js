import { test, expect } from "@playwright/test";
import { mockFirebaseAuth, loginTestUser } from "./helpers/firebase.js";

test.describe("Main menu", () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebaseAuth(page);
        await loginTestUser(page);
    });

    test("displays the Control Panel heading", async ({ page }) => {
        await expect(
            page.getByRole("heading", { name: /control panel/i }),
        ).toBeVisible();
    });

    test("displays the My Day section with milking buttons", async ({ page }) => {
        await expect(page.getByText(/my day/i)).toBeVisible();
        await expect(page.getByText(/before milking/i)).toBeVisible();
        await expect(page.getByText(/during milking/i)).toBeVisible();
        await expect(page.getByText(/milk care/i)).toBeVisible();
    });

    test("displays the More Actions section", async ({ page }) => {
        await expect(page.getByText(/more actions/i)).toBeVisible();
        await expect(page.getByText(/health/i)).toBeVisible();
        await expect(page.getByText(/food/i)).toBeVisible();
        await expect(page.getByText(/facilities/i)).toBeVisible();
    });

    test("displays the My Account section", async ({ page }) => {
        await expect(page.getByText(/my account/i)).toBeVisible();
        await expect(page.getByText(/my profile/i)).toBeVisible();
        await expect(page.getByText(/settings/i)).toBeVisible();
        await expect(page.getByText(/information/i)).toBeVisible();
    });

    test("Before Milking button navigates to the survey", async ({ page }) => {
        await page.getByText(/before milking/i).click();
        await expect(page).toHaveURL(/\/survey\/before-milking-start/);
    });

    test("Settings button navigates to /config", async ({ page }) => {
        await page.getByText(/^settings$/i).click();
        await expect(page).toHaveURL(/\/config/);
    });

    test("My Profile button navigates to /profile", async ({ page }) => {
        await page.getByText(/my profile/i).click();
        await expect(page).toHaveURL(/\/profile/);
    });

    test("Information & Help button navigates to /info", async ({ page }) => {
        await page.getByText(/information/i).click();
        await expect(page).toHaveURL(/\/info/);
    });
});
