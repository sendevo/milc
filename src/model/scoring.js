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
 * @param {number} totalDays - Number of scored app-use days (distinct dates)
 * @returns {number} Expected occurrences as an integer value
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
    
    // Contabiliza ciclos enteros de días de uso completados.
    return Math.max(1, Math.floor(totalDays / daysPerOccurrence));
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
    if (pec >= 0.91) return "always";        // "Siempre"
    if (pec >= 0.51) return "almostAlways";  // "Casi Siempre"
    if (pec >= 0.11) return "sometimes";     // "Algunas Veces"
    return "never";                          // "Nunca"
};

/**
 * Computes the PEC for a single scenario from the log.
 *
 * A record is "correct" if its `answer` matches the node's `score-answer`.
 * Records with a "dont-know" answer are excluded from both numerator
 * and denominator.
 *
 * @param {Array<{scenario: string, answer: string, date: string}>} records
 *   All log records for this scenario (pre-filtered by caller).
 * @param {string} correctAnswer - The value that counts as correct (e.g. "yes")
 * @param {"daily"|"every-other-day"|"weekly"|"biweekly"|"monthly"|"semester"} periodicity
 * @returns {{ pec: number, category: string, correct: number, expected: number }}
 */
export const computePEC = (records, correctAnswer, periodicity) => {
    // 1. Excluir respuestas de desvío educativo ("dont-know")
    const scoredRecords = records.filter(r => r.answer !== "dont-know");

    if (scoredRecords.length === 0) {
        return { pec: 0, category: "never", correct: 0, expected: 0 };
    }

    // 2. Agrupar por fecha única para evitar que respuestas múltiples el mismo día distorsionen el PEC
    const recordsByDate = {};
    for (const record of scoredRecords) {
        recordsByDate[record.date] = record;
    }
    const uniqueDayRecords = Object.values(recordsByDate);

    // 3. El total de días únicos de uso real calcula las ocurrencias esperadas
    const totalAppUseDays = uniqueDayRecords.length;
    const expected = expectedOccurrences(periodicity, totalAppUseDays);

    if (expected === 0) {
        return { pec: 0, category: "never", correct: 0, expected: 0 };
    }

    // 4. Contar cuántos de esos días únicos contaron con la respuesta correcta
    const correct = uniqueDayRecords.filter((r) => r.answer === correctAnswer).length;
    const pec = Math.min(correct / expected, 1); // Forzar tope máximo en 1.0 (100%)

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
 * MR = severity * (1 - PEC) / 3
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
 * Maps a category's average MR to a result rating.
 * Aligned with the exact limits defined in the MILC INTA spreadsheet.
 *
 * @param {number} avgMR
 * @returns {"excellent"|"very-good"|"regular"|"needs-improvement"}
 */
export const classifyResult = (avgMR) => {
    if (avgMR >= 0.91) return "needs-improvement";
    if (avgMR >= 0.51) return "regular";
    if (avgMR >= 0.11) return "very-good";
    return "excellent";
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
 * @param {Array<{scenario: string, answer: string, date: string}>} allRecords
 *   The full log from useSurveyLog.
 * @param {Object} nodes
 *   The full nodes tree from nodes.json (keyed by view id).
 * @param {string|string[]} milkingSetup
 *   The user's milking setup tokens (e.g. ["mecanico", "sin-sala"]); a single
 *   method string is also accepted.
 * @returns {Object} Scoring summary
 */
export const computeFullScore = (allRecords, nodes, milkingSetup = "todos") => {
    const byScenario = {};
    const setupTokens = Array.isArray(milkingSetup) ? milkingSetup : [milkingSetup];

    // 1. Procesamiento individual por cada Nodo del árbol de decisiones
    for (const [nodeId, node] of Object.entries(nodes)) {
        const scenarioId = node.scenario;
        if (!scenarioId || scenarioId === "-") continue;

        const hasNumericInput = (node.fields || []).some((field) => field.type === "number_input");
        if (!node["score-answer"] && hasNumericInput) continue;
        const hasOwnScoringSignal = (node.severity && node.severity > 0) || node["score-answer"];
        if (!hasOwnScoringSignal) continue;

        // "milking-method" lists the setups a question applies to, e.g. "manual,sin-sala"
        const nodeSetups = String(node["milking-method"] || "").split(",").map((s) => s.trim()).filter(Boolean);
        const appliesToUser = nodeSetups.length === 0
            || nodeSetups.includes("todos")
            || nodeSetups.some((s) => setupTokens.includes(s));
        if (!appliesToUser) continue;
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

        // Conditional questions are only asked for some answers of a previous
        // question (e.g. labeling is skipped when milk is processed immediately):
        // when unanswered they are left out instead of counting as PEC 0.
        if (node.conditional && records.length === 0) continue;

        // Corrección INTA: Si la pregunta no posee respuestas registradas en el log, 
        // toma el comportamiento por defecto (PEC: 0), garantizando que compute la categoría grupal.
        const { pec, category: pecCategory, correct, expected } = records.length > 0 
            ? computePEC(records, correctAnswer, periodicity)
            : { pec: 0, category: "never", correct: 0, expected: 0 };

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

    // 2. Agrupación y Ponderación por Categoría Temática (Estructura de matriz del Excel)
    const grouped = {};
    for (const data of Object.values(byScenario)) {
        if (!grouped[data.category]) {
            grouped[data.category] = { pecs: [], severities: [] };
        }
        grouped[data.category].pecs.push(data.pec);
        grouped[data.category].severities.push(data.severity);
    }

    const byCategory = {};
    for (const [cat, data] of Object.entries(grouped)) {
        // Obtiene promedios globales de componentes tal como dicta la planilla matemática
        const avgPEC = data.pecs.reduce((acc, v) => acc + v, 0) / data.pecs.length;
        const avgSeverity = data.severities.reduce((acc, v) => acc + v, 0) / data.severities.length;
        
        // El MR grupal se computa a partir de los promedios globales ponderados del grupo
        const avgMR = computeMR(avgPEC, avgSeverity);
        const rating = classifyResult(avgMR);

        byCategory[cat] = {
            avgPEC,
            avgSeverity,
            avgMR,
            rating,
            resultViewId: resultViewId(rating),
        };
    }

    return { byScenario, byCategory };
};
