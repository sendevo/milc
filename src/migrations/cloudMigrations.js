import { get, ref, set } from "firebase/database";
import { db } from "../firebase";

export const CURRENT_PROFILE_SCHEMA_VERSION = 1;

function normalizeUserProfile(profile) {
    const now = Date.now();
    const safe = profile && typeof profile === "object" ? profile : {};

    return {
        ...safe,
        schemaVersion: CURRENT_PROFILE_SCHEMA_VERSION,
        createdAt: typeof safe.createdAt === "number" ? safe.createdAt : now,
        updatedAt: now,
    };
}

export async function migrateUserProfileIfNeeded(uid) {
    if (!uid) return;

    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    const profile = snapshot.val();

    if (!profile || typeof profile !== "object") return;

    const version = Number(profile.schemaVersion || 0);
    if (version >= CURRENT_PROFILE_SCHEMA_VERSION) return;

    await set(userRef, normalizeUserProfile(profile));
}

export async function buildVersionedUserProfile(uid, profilePatch) {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    const existing = snapshot.val();

    const normalizedExisting = normalizeUserProfile(existing);

    return {
        ...normalizedExisting,
        ...profilePatch,
        schemaVersion: CURRENT_PROFILE_SCHEMA_VERSION,
        createdAt: normalizedExisting.createdAt,
        updatedAt: Date.now(),
    };
}
