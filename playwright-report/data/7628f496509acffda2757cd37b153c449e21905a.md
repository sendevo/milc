# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: main-menu.spec.js >> Main menu >> Before Milking button navigates to the survey
- Location: e2e/main-menu.spec.js:37:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/survey\/before-milking-start/
Received string:  "http://localhost:5173/app"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:5173/app"

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
  4  | test.describe("Main menu", () => {
  5  |     test.beforeEach(async ({ page }) => {
  6  |         await mockFirebaseAuth(page);
  7  |         await loginTestUser(page);
  8  |     });
  9  | 
  10 |     test("displays the Control Panel heading", async ({ page }) => {
  11 |         await expect(
  12 |             page.getByRole("heading", { name: /control panel/i }),
  13 |         ).toBeVisible();
  14 |     });
  15 | 
  16 |     test("displays the My Day section with milking buttons", async ({ page }) => {
  17 |         await expect(page.getByText(/my day/i)).toBeVisible();
  18 |         await expect(page.getByText(/before milking/i)).toBeVisible();
  19 |         await expect(page.getByText(/during milking/i)).toBeVisible();
  20 |         await expect(page.getByText(/milk care/i)).toBeVisible();
  21 |     });
  22 | 
  23 |     test("displays the More Actions section", async ({ page }) => {
  24 |         await expect(page.getByText(/more actions/i)).toBeVisible();
  25 |         await expect(page.getByText(/health/i)).toBeVisible();
  26 |         await expect(page.getByText(/food/i)).toBeVisible();
  27 |         await expect(page.getByText(/facilities/i)).toBeVisible();
  28 |     });
  29 | 
  30 |     test("displays the My Account section", async ({ page }) => {
  31 |         await expect(page.getByText(/my account/i)).toBeVisible();
  32 |         await expect(page.getByText(/my profile/i)).toBeVisible();
  33 |         await expect(page.getByText(/settings/i)).toBeVisible();
  34 |         await expect(page.getByText(/information/i)).toBeVisible();
  35 |     });
  36 | 
  37 |     test("Before Milking button navigates to the survey", async ({ page }) => {
  38 |         await page.getByText(/before milking/i).click();
> 39 |         await expect(page).toHaveURL(/\/survey\/before-milking-start/);
     |                            ^ Error: expect(page).toHaveURL(expected) failed
  40 |     });
  41 | 
  42 |     test("Settings button navigates to /config", async ({ page }) => {
  43 |         await page.getByText(/^settings$/i).click();
  44 |         await expect(page).toHaveURL(/\/config/);
  45 |     });
  46 | 
  47 |     test("My Profile button navigates to /profile", async ({ page }) => {
  48 |         await page.getByText(/my profile/i).click();
  49 |         await expect(page).toHaveURL(/\/profile/);
  50 |     });
  51 | 
  52 |     test("Information & Help button navigates to /info", async ({ page }) => {
  53 |         await page.getByText(/information/i).click();
  54 |         await expect(page).toHaveURL(/\/info/);
  55 |     });
  56 | });
  57 | 
```