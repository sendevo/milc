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
import {
    ISO_DATE_RE,
    SURVEY_LOG_RECORD_SCHEMA_VERSION,
    SURVEY_LOG_STORAGE_KEY,
} from "../constants/constants";

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

const resolveEffectiveDate = (date) => {
    if (typeof date === "string" && ISO_DATE_RE.test(date)) {
        return date;
    }
    return localDateString();
};

// ---------------------------------------------------------------------------
// Low-level storage helpers (not exported — use the hook instead)
// ---------------------------------------------------------------------------

const readLog = async () => {
    const parsed = await getJSONItem(SURVEY_LOG_STORAGE_KEY, []);
    return Array.isArray(parsed) ? parsed : [];
};

const writeLog = async (records) => {
    try {
        await setJSONItem(SURVEY_LOG_STORAGE_KEY, records);
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
 *   saveAnswer:    (nodeId: string, scenario: string, answer: string, options?: { date?: string }) => void,
 *   getRecords:    () => Array,
 *   clearLog:      () => void,
 *   getRecordsByScenario: (scenarioId: string) => Array,
 *   getActiveDays:  () => number,
 *   hasRecordForDateAndScenarios: (date: string, scenarios: string[]) => boolean,
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
     * @param {{ date?: string }} [options] - Optional save options.
     */
    const saveAnswer = useCallback((nodeId, scenario, answer, options = {}) => {
        if (!nodeId || !scenario || scenario === "-") return;

        const effectiveDate = resolveEffectiveDate(options.date);

        const record = {
            id:        typeof crypto !== "undefined" && crypto.randomUUID
                           ? crypto.randomUUID()
                           : String(Date.now()),
            nodeId,
            scenario,
            answer,
            date:      effectiveDate,
            timestamp: Date.now(),
            schemaVersion: SURVEY_LOG_RECORD_SCHEMA_VERSION,
        };

        setRecords((prev) => {
            // Strict overwrite policy: keep only one record per scenario+node per day.
            const next = [
                ...prev.filter(
                    (r) => !(
                        r.scenario === scenario &&
                        r.nodeId === nodeId &&
                        r.date === effectiveDate
                    ),
                ),
                record,
            ];
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
        const scoredRecords = records.filter(r => r.answer !== "dont-know");
        return new Set(scoredRecords.map((r) => r.date)).size;
    }, [records]);

    /**
     * Returns true if any record exists for the given date and any scenario
     * within the provided scenario list.
     *
     * @param {string} date
     * @param {string[]} scenarios
     * @returns {boolean}
     */
    const hasRecordForDateAndScenarios = useCallback((date, scenarios = []) => {
        if (!ISO_DATE_RE.test(date) || !Array.isArray(scenarios) || scenarios.length === 0) {
            return false;
        }

        const scenarioSet = new Set(scenarios.filter(Boolean));
        if (scenarioSet.size === 0) return false;

        return records.some((r) => r.date === date && scenarioSet.has(r.scenario));
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
        hasRecordForDateAndScenarios,
        clearLog,
    };
};
