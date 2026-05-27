import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const isAndroidNative = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

const isMilcStorageKey = (key) => key.startsWith("milc_");

export async function initPersistentStorage() {
    if (!isAndroidNative()) return;

    // Migrate existing localStorage values into native preferences once.
    for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || !isMilcStorageKey(key)) continue;

        const existing = await Preferences.get({ key });
        if (existing.value !== null) continue;

        const value = localStorage.getItem(key);
        if (value !== null) {
            await Preferences.set({ key, value });
        }
    }

    // Keep a localStorage mirror for synchronous read paths and third-party libs.
    const { keys } = await Preferences.keys();
    for (const key of keys) {
        if (!isMilcStorageKey(key)) continue;
        const { value } = await Preferences.get({ key });
        if (value !== null) {
            localStorage.setItem(key, value);
        }
    }
}

export async function getItem(key) {
    if (isAndroidNative()) {
        const { value } = await Preferences.get({ key });
        if (value !== null) {
            localStorage.setItem(key, value);
            return value;
        }
    }
    return localStorage.getItem(key);
}

export async function setItem(key, value) {
    if (isAndroidNative()) {
        await Preferences.set({ key, value });
    }
    localStorage.setItem(key, value);
}

export async function removeItem(key) {
    if (isAndroidNative()) {
        await Preferences.remove({ key });
    }
    localStorage.removeItem(key);
}

export async function getJSONItem(key, fallbackValue) {
    const raw = await getItem(key);
    if (!raw) return fallbackValue;

    try {
        return JSON.parse(raw);
    } catch {
        return fallbackValue;
    }
}

export async function setJSONItem(key, value) {
    await setItem(key, JSON.stringify(value));
}
