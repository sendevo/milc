/**
 * scoring.js
 *
 * Pure functions for computing PEC (Correct Execution Percentage),
 * MR (Risk Magnitude), and category scores from the survey log.
 *
 * No side effects, no storage access — all functions take plain data
 * and return plain data. This makes them easy to test in isolation.
 *
 * See README.md for a full description of the scoring methodology.
 */
import { SCENARIO_DEFAULTS } from "../constants";

// ---------------------------------------------------------------------------
// Periodicity helpers
// ---------------------------------------------------------------------------

/**
 * Returns the number of times a practice with the given periodicity
 * should have been performed in a given number of app-use days.
 *
 * @param {"daily"|"every-other-day"|"weekly"|"biweekly"|"monthly"|"semester"} periodicity
 * @param {number} totalDays - Number of scored app-use days
 * @returns {number} Expected occurrences as a fractional value
 */
export const expectedOccurrences = (periodicity, totalDays) => {
    if (totalDays <= 0) return 0;
    const periodDays = {
        "daily":          1,
        "every-other-day": 2,
        "weekly":         7,
        "biweekly":       15,
        "monthly":        30,
        "semester":       120,
    };
    const daysPerOccurrence = periodDays[periodicity] ?? 1;
    return totalDays / daysPerOccurrence;
};

// ---------------------------------------------------------------------------
// PEC calculation
// ---------------------------------------------------------------------------

/**
 * Classifies a raw PEC percentage (0–1) into a named category.
 *
 * @param {number} pec - Ratio between 0 and 1
 * @returns {"always"|"almostAlways"|"sometimes"|"never"}
 */
export const classifyPEC = (pec) => {
    if (pec >= 0.91) return "always";
    if (pec >= 0.51) return "almostAlways";
    if (pec >= 0.11) return "sometimes";
    return "never";
};

/**
 * Computes the PEC for a single scenario from the log.
 *
 * A record is "correct" if its `answer` matches the node's `score-answer`.
 * Records with a "dont-know" answer are excluded from both numerator
 * and denominator (they neither help nor hurt the score, matching the
 * spreadsheet's NO SUMA / blank-cell behavior).
 *
 * @param {Array<{scenario: string, answer: string, date: string}>} records
 *   All log records for this scenario (pre-filtered by caller).
 * @param {string} correctAnswer - The value that counts as correct (e.g. "yes")
 * @param {"daily"|"every-other-day"|"weekly"|"biweekly"|"monthly"|"semester"} periodicity
 * @returns {{ pec: number, category: string, correct: number, expected: number }}
 */
export const computePEC = (records, correctAnswer, periodicity) => {
    // Exclude "don't know" answers — they are educational detours, not executions.
    const scored = records.filter(r => r.answer !== "dont-know");
    const expected = expectedOccurrences(periodicity, scored.length);

    if (expected === 0) {
        return { pec: 0, category: "never", correct: 0, expected: 0 };
    }

    const correct = scored.filter((r) => r.answer === correctAnswer).length;
    const pec = Math.min(correct / expected, 1); // cap at 1.0

    return {
        pec,
        category: classifyPEC(pec),
        correct,
        expected,
    };
};

// ---------------------------------------------------------------------------
// MR calculation
// ---------------------------------------------------------------------------

/**
 * Computes MR from the raw PEC value and consequence severity.
 *
 * MILC 2024 defines the risk magnitude as:
 * MR = severity * (1 - PEC) / 3
 *
 * PEC is normalized to the [0, 1] range and severity is expected to be 1, 2,
 * or 3. This keeps MR in the [0, 1] range while preserving the guide's
 * boundaries: S1 max ≈ 0.33, S2 max ≈ 0.67, S3 max = 1.00.
 *
 * @param {number} pec
 * @param {1|2|3} severity
 * @returns {number} MR value between 0 and 1
 */
export const computeMR = (pec, severity) => {
    const safePec = Number.isFinite(pec) ? Math.min(1, Math.max(0, pec)) : 0;
    const safeSeverity = Number.isFinite(severity)
        ? Math.min(3, Math.max(1, severity))
        : 1;

    const mr = (safeSeverity * (1 - safePec)) / 3;
    return Math.min(1, Math.max(0, mr));
};

// ---------------------------------------------------------------------------
// Category aggregation
// ---------------------------------------------------------------------------

/**
 * Computes the average MR for an array of individual MR values.
 *
 * @param {number[]} mrValues
 * @returns {number} Average MR, or 0 if the array is empty
 */
export const computeCategoryMR = (mrValues) => {
    if (!mrValues || mrValues.length === 0) return 0;
    const sum = mrValues.reduce((acc, v) => acc + v, 0);
    return sum / mrValues.length;
};

/**
 * Maps a category's average MR to a result rating.
 *
 * @param {number} avgMR
 * @returns {"excellent"|"very-good"|"regular"|"needs-improvement"}
 */
export const classifyResult = (avgMR) => {
    if (avgMR <= 0.10) return "excellent";
    if (avgMR <= 0.50) return "very-good";
    if (avgMR <= 0.90) return "regular";
    return "needs-improvement";
};

/**
 * Maps a result rating to its corresponding result view ID.
 *
 * @param {"excellent"|"very-good"|"regular"|"needs-improvement"} rating
 * @returns {string} View node ID
 */
export const resultViewId = (rating) => {
    const map = {
        "excellent":          "view-result-excellent",
        "very-good":          "view-result-good",
        "regular":            "view-result-regular",
        "needs-improvement":  "view-result-bad",
    };
    return map[rating] ?? "view-result-bad";
};

// ---------------------------------------------------------------------------
// Full scoring pipeline
// ---------------------------------------------------------------------------

/**
 * Runs the complete scoring pipeline over the full log and the node tree.
 *
 * For each scoreable node (scenario !== "-" and the required scoring metadata
 * is present), it looks up the log records that belong to that node, computes
 * PEC, then MR, and groups the result by category.
 *
 * The returned `byScenario` object is keyed by node ID so shared scenarios do
 * not collapse multiple scoreable questions into a single PEC/MR value.
 *
 * @param {Array<{scenario: string, answer: string, date: string}>} allRecords
 *   The full log from useSurveyLog.
 * @param {Object} nodes
 *   The full nodes tree from nodes.json (keyed by view id).
 * @returns {Object} Scoring summary:
 *   {
 *     byScenario: { [nodeId]: { nodeId, scenario, pec, pecCategory, mr, severity, category } },
 *     byCategory: { [category]: { avgMR, rating, resultViewId } },
 *   }
 */

export const computeFullScore = (allRecords, nodes) => {
    // Compute PEC + MR per scoreable node.
    const byScenario = {};
    for (const [nodeId, node] of Object.entries(nodes)) {
        const scenarioId = node.scenario;
        if (!scenarioId || scenarioId === "-") continue;

        const hasNumericInput = (node.fields || []).some((field) => field.type === "number_input");
        if (!node["score-answer"] && hasNumericInput) continue;

        const fallback = SCENARIO_DEFAULTS[scenarioId] ?? {};
        const correctAnswer = node["score-answer"] || fallback.correctAnswer;
        const severity = node.severity || fallback.severity;
        const periodicity = node.periodicity || fallback.periodicity;
        const category = node.category || fallback.category || "uncategorized";

        if (!correctAnswer || !severity || !periodicity) continue;

        const records = allRecords.filter((record) => {
            if (record.nodeId) return record.nodeId === nodeId;
            return record.scenario === scenarioId;
        });

        if (records.length === 0) continue;

        const { pec, category: pecCategory, correct, expected } = computePEC(
            records,
            correctAnswer,
            periodicity
        );
        const mr = computeMR(pec, severity);

        byScenario[nodeId] = {
            nodeId,
            scenario: scenarioId,
            pec,
            pecCategory,
            correct,
            expected,
            mr,
            severity,
            category,
        };
    }

    // Aggregate MR values by thematic category.
    const grouped = {};
    for (const data of Object.values(byScenario)) {
        if (!grouped[data.category]) grouped[data.category] = [];
        grouped[data.category].push(data.mr);
    }

    const byCategory = {};
    for (const [cat, mrValues] of Object.entries(grouped)) {
        const avgMR  = computeCategoryMR(mrValues);
        const rating = classifyResult(avgMR);
        byCategory[cat] = {
            avgMR,
            rating,
            resultViewId: resultViewId(rating),
        };
    }

    return { byScenario, byCategory };
};
