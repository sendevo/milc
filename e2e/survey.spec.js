import { test, expect } from "@playwright/test";
import { mockFirebaseAuth, loginTestUser } from "./helpers/firebase.js";

/**
 * Survey flow tests.
 *
 * The survey nodes are loaded from the bundled nodes.json fallback (no cache
 * in a fresh browser context), so these tests run without Firebase connectivity.
 *
 * Node tested: before-milking-start → select → before-milking-start-animal-count
 */

test.describe("Survey — before milking flow", () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebaseAuth(page);
        await loginTestUser(page);
        await page.goto("/survey/before-milking-start");
    });

    test("renders the Before Milking step title", async ({ page }) => {
        await expect(page.getByText(/before milking/i)).toBeVisible();
    });

    test("renders the cleaned-space question", async ({ page }) => {
        await expect(page.getByText(/have you cleaned the space/i)).toBeVisible();
    });

    test("renders Yes, No, and Don't know options", async ({ page }) => {
        await expect(page.getByText(/^yes$/i)).toBeVisible();
        await expect(page.getByText(/^no$/i)).toBeVisible();
        await expect(page.getByText(/don't know/i)).toBeVisible();
    });

    test("selecting Yes advances to the Animal Count step", async ({ page }) => {
        await page.getByText(/^yes$/i).click();
        await expect(page).toHaveURL(/\/survey\/before-milking-start-animal-count/);
    });

    test("selecting No advances to the Animal Count step", async ({ page }) => {
        await page.getByText(/^no$/i).click();
        await expect(page).toHaveURL(/\/survey\/before-milking-start-animal-count/);
    });

    test("selecting Don't know advances to the parlor tip step", async ({
        page,
    }) => {
        await page.getByText(/don't know/i).click();
        await expect(page).toHaveURL(/\/survey\/before-milking-start-parlor-tip/);
    });

    test("back button returns to the previous page", async ({ page }) => {
        await page.locator('button:has(svg[data-testid="ArrowBackIosNewIcon"])').click();
        await expect(page).toHaveURL(/\/app/);
    });
});

test.describe("Survey — Animal Count step", () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebaseAuth(page);
        await loginTestUser(page);
        await page.goto("/survey/before-milking-start-animal-count");
    });

    test("renders the Animal Count step title", async ({ page }) => {
        await expect(page.getByText(/animal count/i)).toBeVisible();
    });

    test("renders the number-of-animals-being-milked label", async ({
        page,
    }) => {
        await expect(
            page.getByText(/number of animals being milked/i),
        ).toBeVisible();
    });

    test("navigating to unknown survey node redirects to /app", async ({
        page,
    }) => {
        await page.goto("/survey/non-existent-node-xyz");
        await page.waitForURL(/\/app/, { timeout: 8_000 });
    });
});
