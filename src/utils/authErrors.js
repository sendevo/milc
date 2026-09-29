/**
 * Maps Firebase Auth error codes to translation keys, so login and register
 * screens can tell the user what to fix instead of a generic failure.
 */
const AUTH_ERROR_KEYS = {
    "auth/weak-password": "authErrors.weakPassword",
    "auth/email-already-in-use": "authErrors.emailInUse",
    "auth/credential-already-in-use": "authErrors.emailInUse",
    "auth/invalid-email": "authErrors.invalidEmail",
    "auth/missing-password": "authErrors.missingPassword",
    // With email enumeration protection Firebase reports a wrong password and an
    // unknown user with the same code, so both share one message.
    "auth/invalid-credential": "authErrors.invalidCredentials",
    "auth/invalid-login-credentials": "authErrors.invalidCredentials",
    "auth/wrong-password": "authErrors.invalidCredentials",
    "auth/user-not-found": "authErrors.invalidCredentials",
    "auth/user-disabled": "authErrors.userDisabled",
    "auth/too-many-requests": "authErrors.tooManyRequests",
    "auth/network-request-failed": "authErrors.network",
};

/**
 * @param {unknown} error - Error thrown by Firebase Auth
 * @param {string} fallbackKey - Translation key used for unknown errors
 * @returns {string} Translation key
 */
export const getAuthErrorKey = (error, fallbackKey) => AUTH_ERROR_KEYS[error?.code] ?? fallbackKey;
