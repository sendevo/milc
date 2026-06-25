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

// ---------------------------------------------------------------------------
// MR lookup table
// Rows: PEC category. Columns: severity level (1, 2, 3).
// ---------------------------------------------------------------------------

const MR_TABLE = {
    always:        { 1: 0.00, 2: 0.00, 3: 0.00 },
    almostAlways:  { 1: 0.01, 2: 0.10, 3: 0.37 },
    sometimes:     { 1: 0.37, 2: 0.77, 3: 0.90 },
    never:         { 1: 0.67, 2: 1.00, 3: 1.00 },
};

// Fallback metadata for known MILC scenarios.
// Used when nodes arrive without scoring fields from Firebase/nodes.json.
const SCENARIO_DEFAULTS = {
    "PREORD-01": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "PREORD-02": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "PREORD-03": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "PREORD-04": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "PREORD-05": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "PREORD-06": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "PREORD-07": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "PREORD-08": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "ORD-02-03": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "during-milking" },
    "ORD-07": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "during-milking" },
    "HEALTH-01": { correctAnswer: "no", severity: 3, periodicity: "daily", category: "health" },
    "FEED-01": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "food" },
    "FACIL-01": { correctAnswer: "yes", severity: 3, periodicity: "semester", category: "facilities" },
    "FACIL-02": { correctAnswer: "yes", severity: 3, periodicity: "semester", category: "facilities" },
    "FACIL-03": { correctAnswer: "yes", severity: 3, periodicity: "semester", category: "facilities" },
    "SUPPLY-01": { correctAnswer: "yes", severity: 3, periodicity: "semester", category: "supplies" },
    "SUPPLY-02": { correctAnswer: "yes", severity: 3, periodicity: "semester", category: "supplies" },
};

// ---------------------------------------------------------------------------
// Periodicity helpers
// ---------------------------------------------------------------------------

/**
 * Returns the number of times a practice with the given periodicity
 * should have been performed in a given number of app-use days.
 *
 * @param {"daily"|"every-other-day"|"weekly"|"biweekly"|"monthly"|"semester"} periodicity
 * @param {number} totalDays - Number of distinct days the user used the app
 * @returns {number} Expected occurrences (floored to whole number, minimum 0)
 */
export const expectedOccurrences = (periodicity, totalDays) => {
    if (totalDays <= 0) return 0;
    const rates = {
        "daily":          1,
        "every-other-day": 1 / 2,
        "weekly":         1 / 7,
        "biweekly":       1 / 15,
        "monthly":        1 / 30,
        "semester":       1 / 120,
    };
    const rate = rates[periodicity] ?? 1;
    return Math.max(0, Math.floor(totalDays * rate));
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
 * Records with a "dont-know" / "dont_know" answer are excluded from both
 * numerator and denominator (they neither help nor hurt the score, but they
 * do not count as an app-use day for this scenario).
 *
 * @param {Array<{scenario: string, answer: string, date: string}>} records
 *   All log records for this scenario (pre-filtered by caller).
 * @param {string} correctAnswer - The value that counts as correct (e.g. "yes")
 * @param {"daily"|"every-other-day"|"weekly"|"biweekly"|"monthly"|"semester"} periodicity
 * @returns {{ pec: number, category: string, correct: number, expected: number }}
 */
export const computePEC = (records, correctAnswer, periodicity) => {
    // Exclude "don't know" answers — they are educational detours, not executions.
    const scored = records.filter(
        (r) => r.answer !== "dont-know" && r.answer !== "dont_know"
    );

    // Count distinct days with any scored answer (the denominator).
    const distinctDays = new Set(scored.map((r) => r.date)).size;
    let expected = expectedOccurrences(periodicity, distinctDays);

    // If there is scored evidence but expected rounds down to zero
    // (e.g. semester checks in short ranges), mark one expected occurrence.
    if (expected === 0 && scored.length > 0) {
        expected = 1;
    }

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
 * Looks up the MR value from the cross-table of PEC category × severity.
 *
 * @param {"always"|"almostAlways"|"sometimes"|"never"} pecCategory
 * @param {1|2|3} severity
 * @returns {number} MR value between 0 and 1
 */
export const computeMR = (pecCategory, severity) => {
    return MR_TABLE[pecCategory]?.[severity] ?? 1.0;
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
 * For each node that has a scoreable scenario (scenario !== "-" and scenario
 * is defined), it looks up all log records for that scenario, computes PEC,
 * then MR, and groups the result by category.
 *
 * Nodes with the same `scenario` value are deduplicated — only one PEC is
 * computed per scenario, using all records for that scenario across any node.
 *
 * @param {Array<{scenario: string, answer: string, date: string}>} allRecords
 *   The full log from useSurveyLog.
 * @param {Object} nodes
 *   The full nodes tree from nodes.json (keyed by view id).
 * @returns {Object} Scoring summary:
 *   {
 *     byScenario: { [scenarioId]: { pec, pecCategory, mr, severity, category } },
 *     byCategory: { [category]: { avgMR, rating, resultViewId } },
 *   }
 */
export const computeFullScore = (allRecords, nodes) => {
    // Build a map of scenario → node metadata (first node wins for dedup).
    const scenarioMeta = {};
    for (const node of Object.values(nodes)) {
        const s = node.scenario;
        if (!s || s === "-" || scenarioMeta[s]) continue;

        const fallback = SCENARIO_DEFAULTS[s] ?? {};
        const correctAnswer = node["score-answer"] || fallback.correctAnswer;
        const severity = node.severity || fallback.severity;
        const periodicity = node.periodicity || fallback.periodicity;
        const category = node.category || fallback.category || "uncategorized";

        if (!correctAnswer || !severity || !periodicity) continue;

        scenarioMeta[s] = {
            correctAnswer,
            severity,
            periodicity,
            category,
        };
    }

    // Compute PEC + MR per scenario.
    const byScenario = {};
    for (const [scenarioId, meta] of Object.entries(scenarioMeta)) {
        const records = allRecords.filter((r) => r.scenario === scenarioId);
        const { pec, category: pecCategory, correct, expected } = computePEC(
            records,
            meta.correctAnswer,
            meta.periodicity
        );
        const mr = computeMR(pecCategory, meta.severity);

        byScenario[scenarioId] = {
            pec,
            pecCategory,
            correct,
            expected,
            mr,
            severity:  meta.severity,
            category:  meta.category,
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
