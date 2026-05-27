/**
 * useSurveyLog.js
 *
 * React hook that manages the persistent log of survey responses.
 *
 * Each entry in the log represents one answer to one scoreable node.
 * The log is stored under the key "milc_survey_log" in app persistent storage.
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

import { useCallback, useEffect, useState } from "react";
import { getJSONItem, setJSONItem } from "../utils/persistentStorage";

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

const readLog = async () => {
    const parsed = await getJSONItem(STORAGE_KEY, []);
    return Array.isArray(parsed) ? parsed : [];
};

const writeLog = async (records) => {
    try {
        await setJSONItem(STORAGE_KEY, records);
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
    const [records, setRecords] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const hydrate = async () => {
            const persisted = await readLog();
            if (isMounted) {
                setRecords(persisted);
            }
        };

        hydrate();

        return () => {
            isMounted = false;
        };
    }, []);

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

        setRecords((prev) => {
            const next = [...prev, record];
            void writeLog(next);
            return next;
        });
    }, []);

    /**
     * Returns all records in the log, sorted oldest-first.
     *
     * @returns {Array}
     */
    const getRecords = useCallback(() => {
        return [...records].sort((a, b) => a.timestamp - b.timestamp);
    }, [records]);

    /**
     * Returns all records for a specific scenario.
     *
     * @param {string} scenarioId
     * @returns {Array}
     */
    const getRecordsByScenario = useCallback((scenarioId) => {
        return records.filter((r) => r.scenario === scenarioId);
    }, [records]);

    /**
     * Returns the number of distinct calendar days on which any
     * scored answer was recorded. This is the global app-use day count
     * used as the denominator baseline before per-scenario filtering.
     *
     * @returns {number}
     */
    const getActiveDays = useCallback(() => {
        const scoredRecords = records.filter(
            (r) => r.answer !== "dont-know" && r.answer !== "dont_know"
        );
        return new Set(scoredRecords.map((r) => r.date)).size;
    }, [records]);

    /**
     * Wipes the entire log. Useful for development / profile reset.
     */
    const clearLog = useCallback(() => {
        setRecords([]);
        void writeLog([]);
    }, []);

    return {
        saveAnswer,
        getRecords,
        getRecordsByScenario,
        getActiveDays,
        clearLog,
    };
};
