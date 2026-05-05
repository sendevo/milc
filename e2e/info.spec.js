import { test, expect } from "@playwright/test";
import { mockFirebaseAuth, loginTestUser } from "./helpers/firebase.js";

test.describe("Info page", () => {
    test.beforeEach(async ({ page }) => {
        await mockFirebaseAuth(page);
        await loginTestUser(page);
        await page.goto("/info");
    });

    test("displays the About MILC heading", async ({ page }) => {
        await expect(
            page.getByRole("heading", { name: /about milc/i }),
        ).toBeVisible();
    });

    test("displays accordion sections", async ({ page }) => {
        // MUI Accordion summaries render with role=button
        const accordionSummaries = page.locator(".MuiAccordionSummary-root");
        await expect(accordionSummaries.first()).toBeVisible();
    });

    test("can expand the version accordion", async ({ page }) => {
        const versionAccordion = page.getByText(/application version/i).first();
        await versionAccordion.click();
        await expect(page.getByText(/MILC 1\.0\.0/)).toBeVisible();
    });

    test("back button returns to /app", async ({ page }) => {
        await page.locator('button:has(svg[data-testid="ArrowBackIosNewIcon"])').click();
        await expect(page).toHaveURL(/\/app/);
    });
});
