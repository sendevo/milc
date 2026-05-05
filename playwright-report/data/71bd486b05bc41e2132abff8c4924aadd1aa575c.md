# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: survey.spec.js >> Survey — Animal Count step >> renders the Animal Count step title
- Location: e2e/survey.spec.js:64:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/animal count/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/animal count/i)

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - heading "Control Panel" [level=6] [ref=e6]
  - generic [ref=e8]:
    - generic [ref=e9]:
      - heading "My Day" [level=6] [ref=e10]
      - generic [ref=e12]:
        - generic [ref=e13] [cursor=pointer]:
          - img "Before Milking" [ref=e15]
          - generic [ref=e16]: Before Milking
        - generic [ref=e17]:
          - img "During Milking" [ref=e19]
          - generic [ref=e20]: During Milking
        - generic [ref=e21]:
          - img "Milk Care" [ref=e23]
          - generic [ref=e24]: Milk Care
    - generic [ref=e25]:
      - heading "More Actions" [level=6] [ref=e26]
      - generic [ref=e28]:
        - generic [ref=e29]:
          - img "Health" [ref=e31]
          - generic [ref=e32]: Health
        - generic [ref=e33]:
          - img "Food" [ref=e35]
          - generic [ref=e36]: Food
        - generic [ref=e37]:
          - img "Facilities" [ref=e39]
          - generic [ref=e40]: Facilities
        - generic [ref=e41]:
          - img "My Supplies" [ref=e43]
          - generic [ref=e44]: My Supplies
        - generic [ref=e45]:
          - img "Pests & Rodents" [ref=e47]
          - generic [ref=e48]: Pests & Rodents
        - generic [ref=e49]:
          - img "My Records" [ref=e51]
          - generic [ref=e52]: My Records
    - generic [ref=e53]:
      - heading "My Account" [level=6] [ref=e54]
      - generic [ref=e56]:
        - generic [ref=e57] [cursor=pointer]:
          - img "My Profile" [ref=e59]
          - generic [ref=e60]: My Profile
        - generic [ref=e61] [cursor=pointer]:
          - img "Settings" [ref=e63]
          - generic [ref=e64]: Settings
        - generic [ref=e65] [cursor=pointer]:
          - img "Information & Help" [ref=e67]
          - generic [ref=e68]: Information & Help
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { mockFirebaseAuth, loginTestUser } from "./helpers/firebase.js";
  3  | 
  4  | /**
  5  |  * Survey flow tests.
  6  |  *
  7  |  * The survey nodes are loaded from the bundled nodes.json fallback (no cache
  8  |  * in a fresh browser context), so these tests run without Firebase connectivity.
  9  |  *
  10 |  * Node tested: before-milking-start → select → before-milking-start-animal-count
  11 |  */
  12 | 
  13 | test.describe("Survey — before milking flow", () => {
  14 |     test.beforeEach(async ({ page }) => {
  15 |         await mockFirebaseAuth(page);
  16 |         await loginTestUser(page);
  17 |         await page.goto("/survey/before-milking-start");
  18 |     });
  19 | 
  20 |     test("renders the Before Milking step title", async ({ page }) => {
  21 |         await expect(page.getByText(/before milking/i)).toBeVisible();
  22 |     });
  23 | 
  24 |     test("renders the cleaned-space question", async ({ page }) => {
  25 |         await expect(page.getByText(/have you cleaned the space/i)).toBeVisible();
  26 |     });
  27 | 
  28 |     test("renders Yes, No, and Don't know options", async ({ page }) => {
  29 |         await expect(page.getByText(/^yes$/i)).toBeVisible();
  30 |         await expect(page.getByText(/^no$/i)).toBeVisible();
  31 |         await expect(page.getByText(/don't know/i)).toBeVisible();
  32 |     });
  33 | 
  34 |     test("selecting Yes advances to the Animal Count step", async ({ page }) => {
  35 |         await page.getByText(/^yes$/i).click();
  36 |         await expect(page).toHaveURL(/\/survey\/before-milking-start-animal-count/);
  37 |     });
  38 | 
  39 |     test("selecting No advances to the Animal Count step", async ({ page }) => {
  40 |         await page.getByText(/^no$/i).click();
  41 |         await expect(page).toHaveURL(/\/survey\/before-milking-start-animal-count/);
  42 |     });
  43 | 
  44 |     test("selecting Don't know advances to the parlor tip step", async ({
  45 |         page,
  46 |     }) => {
  47 |         await page.getByText(/don't know/i).click();
  48 |         await expect(page).toHaveURL(/\/survey\/before-milking-start-parlor-tip/);
  49 |     });
  50 | 
  51 |     test("back button returns to the previous page", async ({ page }) => {
  52 |         await page.locator('button:has(svg[data-testid="ArrowBackIosNewIcon"])').click();
  53 |         await expect(page).toHaveURL(/\/app/);
  54 |     });
  55 | });
  56 | 
  57 | test.describe("Survey — Animal Count step", () => {
  58 |     test.beforeEach(async ({ page }) => {
  59 |         await mockFirebaseAuth(page);
  60 |         await loginTestUser(page);
  61 |         await page.goto("/survey/before-milking-start-animal-count");
  62 |     });
  63 | 
  64 |     test("renders the Animal Count step title", async ({ page }) => {
> 65 |         await expect(page.getByText(/animal count/i)).toBeVisible();
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  66 |     });
  67 | 
  68 |     test("renders the number-of-animals-being-milked label", async ({
  69 |         page,
  70 |     }) => {
  71 |         await expect(
  72 |             page.getByText(/number of animals being milked/i),
  73 |         ).toBeVisible();
  74 |     });
  75 | 
  76 |     test("navigating to unknown survey node redirects to /app", async ({
  77 |         page,
  78 |     }) => {
  79 |         await page.goto("/survey/non-existent-node-xyz");
  80 |         await page.waitForURL(/\/app/, { timeout: 8_000 });
  81 |     });
  82 | });
  83 | 
```