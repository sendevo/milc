import { getItem, getJSONItem, setItem, setJSONItem } from "../utils/persistentStorage";
import {
    CURRENT_LOCAL_SCHEMA_VERSION,
    LOCAL_SCHEMA_VERSION_KEY,
    SURVEY_LOG_STORAGE_KEY,
} from "../constants";

function normalizeSurveyLogRecord(record) {
    if (!record || typeof record !== "object") return null;

    const normalized = { ...record };
    if (normalized.answer === "dont_know") { // previous version
        normalized.answer = "dont-know";
    }
    if (typeof normalized.schemaVersion !== "number") {
        normalized.schemaVersion = 1;
    }
    return normalized;
}

async function migrateToV1() {
    const log = await getJSONItem(SURVEY_LOG_STORAGE_KEY, []);
    if (!Array.isArray(log)) {
        await setJSONItem(SURVEY_LOG_STORAGE_KEY, []);
        return;
    }

    const migrated = log
        .map(normalizeSurveyLogRecord)
        .filter(Boolean);

    await setJSONItem(SURVEY_LOG_STORAGE_KEY, migrated);
}

export async function runLocalMigrations() {
    const rawVersion = await getItem(LOCAL_SCHEMA_VERSION_KEY);
    let version = Number(rawVersion);
    if (!Number.isInteger(version) || version < 0) version = 0;

    if (version < 1) {
        await migrateToV1();
        version = 1;
    }

    if (version !== CURRENT_LOCAL_SCHEMA_VERSION) {
        version = CURRENT_LOCAL_SCHEMA_VERSION;
    }

    await setItem(LOCAL_SCHEMA_VERSION_KEY, String(version));
}
