/**
 * useSurveyLog.js
 *
 * React hook that manages the persistent log of survey responses.
 *
 * Each entry in the log represents one answer to one scoreable node.
 * The log is stored in localStorage under the key "milc_survey_log".
 *
 * Shape of a single log record:
 * {
 *   id:        string  — unique entry id (crypto.randomUUID or Date.now fallback)
 *   nodeId:    string  — the view id (e.g. "view-100")
 *   scenario:  string  — the practice id (e.g. "PREORD-07")
 *   answer:    string  — the raw answer value from the select field
 *   date:      string  — ISO date string "YYYY-MM-DD" (local date, not UTC)
 *   timestamp: number  — Date.now() at time of saving
 * }
 *
 * See README.md for how records are used in PEC / MR calculation.
 */

import { useCallback } from "react";

const STORAGE_KEY = "milc_survey_log";

// ---------------------------------------------------------------------------
// Local-date helper
// ---------------------------------------------------------------------------

/**
 * Returns today's date as "YYYY-MM-DD" in the user's local timezone.
 * Using local date (not UTC) matches the producer's real calendar day.
 */
const localDateString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const dd   = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

// ---------------------------------------------------------------------------
// Low-level storage helpers (not exported — use the hook instead)
// ---------------------------------------------------------------------------

const readLog = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeLog = (records) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (err) {
        console.error("[useSurveyLog] Failed to write log:", err);
    }
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Provides read and write access to the persistent survey log.
 *
 * @returns {{
 *   saveAnswer:    (nodeId: string, scenario: string, answer: string) => void,
 *   getRecords:    () => Array,
 *   clearLog:      () => void,
 *   getRecordsByScenario: (scenarioId: string) => Array,
 *   getActiveDays:  () => number,
 * }}
 */
export const useSurveyLog = () => {
    /**
     * Persists one answer to the log.
     *
     * Only nodes with a real scenario (not "-") should be passed here.
     * "Don't know" answers are intentionally allowed — they are filtered out
     * in scoring.js when calculating PEC, but keeping them in the log
     * preserves a full audit trail of user interactions.
     *
     * @param {string} nodeId   - The view id (e.g. "view-100")
     * @param {string} scenario - The scenario id (e.g. "PREORD-07")
     * @param {string} answer   - The raw answer value (e.g. "yes", "no", "dont-know")
     */
    const saveAnswer = useCallback((nodeId, scenario, answer) => {
        if (!nodeId || !scenario || scenario === "-") return;

        const record = {
            id:        typeof crypto !== "undefined" && crypto.randomUUID
                           ? crypto.randomUUID()
                           : String(Date.now()),
            nodeId,
            scenario,
            answer,
            date:      localDateString(),
            timestamp: Date.now(),
        };

        const existing = readLog();
        writeLog([...existing, record]);
    }, []);

    /**
     * Returns all records in the log, sorted oldest-first.
     *
     * @returns {Array}
     */
    const getRecords = useCallback(() => {
        return readLog().sort((a, b) => a.timestamp - b.timestamp);
    }, []);

    /**
     * Returns all records for a specific scenario.
     *
     * @param {string} scenarioId
     * @returns {Array}
     */
    const getRecordsByScenario = useCallback((scenarioId) => {
        return readLog().filter((r) => r.scenario === scenarioId);
    }, []);

    /**
     * Returns the number of distinct calendar days on which any
     * scored answer was recorded. This is the global app-use day count
     * used as the denominator baseline before per-scenario filtering.
     *
     * @returns {number}
     */
    const getActiveDays = useCallback(() => {
        const records = readLog().filter(
            (r) => r.answer !== "dont-know" && r.answer !== "dont_know"
        );
        return new Set(records.map((r) => r.date)).size;
    }, []);

    /**
     * Wipes the entire log. Useful for development / profile reset.
     */
    const clearLog = useCallback(() => {
        writeLog([]);
    }, []);

    return {
        saveAnswer,
        getRecords,
        getRecordsByScenario,
        getActiveDays,
        clearLog,
    };
};
