/**
 * Firebase mocking helpers for Playwright E2E tests.
 *
 * These intercept the Firebase Auth REST API endpoints and Firebase Realtime
 * Database HTTP long-polling calls so tests run without a live Firebase
 * backend or the Firebase Emulator.
 *
 * To use in a test file:
 *
 *   import { mockFirebaseAuth, loginTestUser, TEST_USER } from "./helpers/firebase.js";
 *
 *   test.beforeEach(async ({ page }) => {
 *     await mockFirebaseAuth(page);
 *   });
 */

export const TEST_USER = {
    uid: "e2e-test-uid-ABC12345",
    email: "e2e@test.example.com",
    password: "TestPassword123!",
};

/**
 * Creates a Firebase-compatible fake JWT.
 * Firebase Auth SDK only base64-decodes the payload client-side — it does NOT
 * verify the signature — so a fake signature is fine for tests.
 */
function makeFakeIdToken(uid, email, projectId = "test-project") {
    const now = Math.floor(Date.now() / 1000);
    const toB64 = (obj) =>
        Buffer.from(JSON.stringify(obj))
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");

    const header = toB64({ alg: "RS256", kid: "test-key-id" });
    const payload = toB64({
        iss: `https://securetoken.google.com/${projectId}`,
        aud: projectId,
        auth_time: now,
        user_id: uid,
        sub: uid,
        iat: now,
        exp: now + 3600,
        email: email,
        email_verified: false,
        firebase: {
            identities: { email: [email] },
            sign_in_provider: "password",
        },
    });

    return `${header}.${payload}.fake-signature-for-e2e-tests`;
}

const FAKE_ID_TOKEN = makeFakeIdToken(TEST_USER.uid, TEST_USER.email);
const FAKE_REFRESH_TOKEN = "fake-refresh-token-e2e-12345";

/**
 * Sets up page.route() intercepts for:
 *  - Firebase Auth sign-in (email/password)
 *  - Firebase Auth anonymous sign-in
 *  - Firebase Auth token refresh
 *  - Firebase Auth getAccountInfo (accounts:lookup)
 *  - Firebase Realtime Database HTTP long-polling (returns null → app uses
 *    bundled nodes.json fallback and empty profile)
 */
export async function mockFirebaseAuth(page) {
    // email/password sign-in
    await page.route(
        /identitytoolkit\.googleapis\.com.*accounts:signInWithPassword/,
        async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    kind: "identitytoolkit#VerifyPasswordResponse",
                    localId: TEST_USER.uid,
                    email: TEST_USER.email,
                    idToken: FAKE_ID_TOKEN,
                    registered: true,
                    refreshToken: FAKE_REFRESH_TOKEN,
                    expiresIn: "3600",
                }),
            });
        },
    );

    // anonymous sign-in (accounts:signUp without email)
    await page.route(
        /identitytoolkit\.googleapis\.com.*accounts:signUp/,
        async (route) => {
            const body = (() => {
                try {
                    return JSON.parse(route.request().postData() ?? "{}");
                } catch {
                    return {};
                }
            })();
            const isAnonymous = body.returnSecureToken && !body.email;
            const anonUid = "e2e-anon-uid-XYZ";
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    kind: "identitytoolkit#SignupNewUserResponse",
                    idToken: makeFakeIdToken(anonUid, "", "test-project"),
                    refreshToken: "anon-refresh-token-e2e",
                    expiresIn: "3600",
                    localId: isAnonymous ? anonUid : TEST_USER.uid,
                }),
            });
        },
    );

    // token refresh
    await page.route(
        /securetoken\.googleapis\.com.*token/,
        async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    access_token: FAKE_ID_TOKEN,
                    expires_in: "3600",
                    token_type: "Bearer",
                    refresh_token: FAKE_REFRESH_TOKEN,
                    id_token: FAKE_ID_TOKEN,
                    user_id: TEST_USER.uid,
                    project_id: "test-project",
                }),
            });
        },
    );

    // getAccountInfo / accounts:lookup
    await page.route(
        /identitytoolkit\.googleapis\.com.*accounts:lookup/,
        async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    kind: "identitytoolkit#GetAccountInfoResponse",
                    users: [
                        {
                            localId: TEST_USER.uid,
                            email: TEST_USER.email,
                            passwordHash: "REDACTED",
                            emailVerified: false,
                            passwordUpdatedAt: Date.now(),
                            providerUserInfo: [
                                {
                                    providerId: "password",
                                    federatedId: TEST_USER.email,
                                    email: TEST_USER.email,
                                    rawId: TEST_USER.email,
                                },
                            ],
                            validSince: "1600000000",
                            disabled: false,
                            lastLoginAt: Date.now().toString(),
                            createdAt: "1600000000000",
                        },
                    ],
                }),
            });
        },
    );

    // Firebase Realtime Database HTTP calls — return null so the app falls
    // back to bundled nodes.json (survey) and empty profile.
    await page.route(/\.firebaseio\.com/, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: "null",
        });
    });
}

/**
 * Navigates to /login, fills in test credentials, submits the form, and
 * waits until the app redirects to /app.
 * Requires that mockFirebaseAuth(page) has already been called.
 */
export async function loginTestUser(page) {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(TEST_USER.email);
    await page.getByPlaceholder("Password").fill(TEST_USER.password);
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL("**/app");
}
