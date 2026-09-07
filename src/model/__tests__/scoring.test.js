/**
 * scoring.test.js
 *
 * Unit tests for the pure functions in scoring.js.
 * Run with: vitest (already configured in a Vite project) or jest.
 */

import { describe, it, expect } from "vitest";
import {
    expectedOccurrences,
    classifyPEC,
    computePEC,
    computeMR,
    computeCategoryMR,
    classifyResult,
    resultViewId,
    computeFullScore,
} from "../scoring";

// ---------------------------------------------------------------------------
// expectedOccurrences
// ---------------------------------------------------------------------------

describe("expectedOccurrences", () => {
    it("daily: 10 days → 10 occurrences", () => {
        expect(expectedOccurrences("daily", 10)).toBe(10);
    });

    it("every-other-day: 10 days → 5 occurrences", () => {
        expect(expectedOccurrences("every-other-day", 10)).toBe(5);
    });

    it("weekly preserves fractional expected occurrences", () => {
        expect(expectedOccurrences("weekly", 10)).toBeCloseTo(10 / 7);
    });

    it("biweekly preserves fractional expected occurrences", () => {
        expect(expectedOccurrences("biweekly", 31)).toBeCloseTo(31 / 15);
    });

    it("monthly preserves fractional expected occurrences", () => {
        expect(expectedOccurrences("monthly", 31)).toBeCloseTo(31 / 30);
    });

    it("semester preserves fractional expected occurrences", () => {
        expect(expectedOccurrences("semester", 180)).toBeCloseTo(180 / 120);
    });

    it("returns 0 for 0 days", () => {
        expect(expectedOccurrences("daily", 0)).toBe(0);
    });

    it("returns 0 for negative days", () => {
        expect(expectedOccurrences("daily", -5)).toBe(0);
    });

    it("unknown periodicity defaults to daily rate", () => {
        expect(expectedOccurrences("unknown", 7)).toBe(7);
    });
});

// ---------------------------------------------------------------------------
// classifyPEC
// ---------------------------------------------------------------------------

describe("classifyPEC", () => {
    it("1.0 → always", ()       => expect(classifyPEC(1.0)).toBe("always"));
    it("0.91 → always", ()      => expect(classifyPEC(0.91)).toBe("always"));
    it("0.90 → almostAlways", () => expect(classifyPEC(0.90)).toBe("almostAlways"));
    it("0.51 → almostAlways", () => expect(classifyPEC(0.51)).toBe("almostAlways"));
    it("0.50 → sometimes", ()   => expect(classifyPEC(0.50)).toBe("sometimes"));
    it("0.11 → sometimes", ()   => expect(classifyPEC(0.11)).toBe("sometimes"));
    it("0.10 → never", ()       => expect(classifyPEC(0.10)).toBe("never"));
    it("0.0 → never", ()        => expect(classifyPEC(0.0)).toBe("never"));
});

// ---------------------------------------------------------------------------
// computePEC
// ---------------------------------------------------------------------------

describe("computePEC", () => {
    const makeRecords = (answers) =>
        answers.map((answer, i) => ({
            scenario: "PREORD-07",
            answer,
            date: `2026-01-${String(i + 1).padStart(2, "0")}`,
        }));

    it("all yes on daily → pec=1.0, category=always", () => {
        const records = makeRecords(["yes", "yes", "yes", "yes"]);
        const result  = computePEC(records, "yes", "daily");
        expect(result.pec).toBe(1.0);
        expect(result.category).toBe("always");
    });

    it("half yes/no → pec=0.5, category=sometimes", () => {
        const records = makeRecords(["yes", "no", "yes", "no"]);
        const result  = computePEC(records, "yes", "daily");
        expect(result.pec).toBe(0.5);
        expect(result.category).toBe("sometimes");
    });

    it("all no → pec=0, category=never", () => {
        const records = makeRecords(["no", "no"]);
        const result  = computePEC(records, "yes", "daily");
        expect(result.pec).toBe(0);
        expect(result.category).toBe("never");
    });

    it("does not collapse same-day records", () => {
        const records = [
            { scenario: "PREORD-07", answer: "yes", date: "2026-01-01", timestamp: 1 },
            { scenario: "PREORD-07", answer: "yes", date: "2026-01-01", timestamp: 2 },
            { scenario: "PREORD-07", answer: "yes", date: "2026-01-02", timestamp: 3 },
        ];

        const result = computePEC(records, "yes", "daily");
        expect(result.correct).toBe(3);
        expect(result.expected).toBe(3);
        expect(result.pec).toBe(1);
        expect(result.category).toBe("always");
    });

    it("returns never if no records", () => {
        const result = computePEC([], "yes", "daily");
        expect(result.pec).toBe(0);
        expect(result.category).toBe("never");
        expect(result.expected).toBe(0);
    });

    it("treats dont-know as no-sum and keeps fractional expected occurrences", () => {
        const records = [
            { scenario: "FACIL-01", answer: "yes", date: "2026-01-01" },
            { scenario: "FACIL-01", answer: "dont-know", date: "2026-01-02" },
            { scenario: "FACIL-01", answer: "no", date: "2026-01-03" },
        ];

        const result = computePEC(records, "yes", "weekly");
        expect(result.expected).toBeCloseTo(2 / 7);
        expect(result.correct).toBe(1);
        expect(result.pec).toBe(1);
        expect(result.category).toBe("always");
    });

    it("caps pec at 1.0 if correct > expected", () => {
        // Fractional expectations can exceed the observed count; PEC is still capped.
        const records = [
            { scenario: "X", answer: "yes", date: "2026-01-01" },
            { scenario: "X", answer: "yes", date: "2026-01-08" },
            { scenario: "X", answer: "yes", date: "2026-01-15" },
        ];
        const result = computePEC(records, "yes", "weekly");
        expect(result.pec).toBeLessThanOrEqual(1.0);
        expect(result.expected).toBeCloseTo(3 / 7);
    });
});

// ---------------------------------------------------------------------------
// computeMR
// ---------------------------------------------------------------------------

describe("computeMR", () => {
    it("PEC=1.0 + S3 → 0.00", () => expect(computeMR(1.0, 3)).toBe(0.00));
    it("PEC=0.9 + S3 → 0.10", () => expect(computeMR(0.9, 3)).toBeCloseTo(0.10));
    it("PEC=0.5 + S2 → 0.33", () => expect(computeMR(0.5, 2)).toBeCloseTo(0.3333333333));
    it("PEC=0.0 + S1 → 0.33", () => expect(computeMR(0.0, 1)).toBeCloseTo(0.3333333333));
    it("PEC=0.0 + S2 → 0.67", () => expect(computeMR(0.0, 2)).toBeCloseTo(0.6666666667));
    it("PEC=0.0 + S3 → 1.00", () => expect(computeMR(0.0, 3)).toBe(1.00));
    it("clamps to 0..1 range", () => {
        expect(computeMR(-0.2, 3)).toBe(1.0);
        expect(computeMR(1.2, 3)).toBe(0.0);
    });
});

// ---------------------------------------------------------------------------
// computeCategoryMR
// ---------------------------------------------------------------------------

describe("computeCategoryMR", () => {
    it("averages values correctly", () => {
        expect(computeCategoryMR([0.0, 1.0])).toBeCloseTo(0.5);
        expect(computeCategoryMR([0.37, 0.77, 0.90])).toBeCloseTo(0.68);
    });

    it("returns 0 for empty array", () => {
        expect(computeCategoryMR([])).toBe(0);
    });

    it("returns single value as-is", () => {
        expect(computeCategoryMR([0.37])).toBe(0.37);
    });
});

// ---------------------------------------------------------------------------
// classifyResult + resultViewId
// ---------------------------------------------------------------------------

describe("classifyResult", () => {
    it("0.00 → excellent",          () => expect(classifyResult(0.00)).toBe("excellent"));
    it("0.10 → excellent",          () => expect(classifyResult(0.10)).toBe("excellent"));
    it("0.11 → very-good",          () => expect(classifyResult(0.11)).toBe("very-good"));
    it("0.50 → very-good",          () => expect(classifyResult(0.50)).toBe("very-good"));
    it("0.51 → regular",            () => expect(classifyResult(0.51)).toBe("regular"));
    it("0.90 → regular",            () => expect(classifyResult(0.90)).toBe("regular"));
    it("0.91 → needs-improvement",  () => expect(classifyResult(0.91)).toBe("needs-improvement"));
    it("1.00 → needs-improvement",  () => expect(classifyResult(1.00)).toBe("needs-improvement"));
});

describe("resultViewId", () => {
    it("maps each rating to the correct view", () => {
        expect(resultViewId("excellent")).toBe("view-result-excellent");
        expect(resultViewId("very-good")).toBe("view-result-good");
        expect(resultViewId("regular")).toBe("view-result-regular");
        expect(resultViewId("needs-improvement")).toBe("view-result-bad");
    });

    it("unknown rating falls back to view-result-bad", () => {
        expect(resultViewId("unknown")).toBe("view-result-bad");
    });
});

// ---------------------------------------------------------------------------
// computeFullScore (integration)
// ---------------------------------------------------------------------------

describe("computeFullScore", () => {
    const nodes = {
        "view-233": {
            scenario:       "PREORD-07",
            "score-answer": "yes",
            severity:       3,
            periodicity:    "daily",
            category:       "before-milking",
            fields: [{ id: "view-233-select", type: "select", options: [] }],
        },
        "view-234": {
            scenario:       "PREORD-07",
            "score-answer": "no",
            severity:       3,
            periodicity:    "daily",
            category:       "before-milking",
            fields: [{ id: "view-234-select", type: "select", options: [] }],
        },
        "view-235": {
            scenario:       "PREORD-07",
            fields: [{ id: "view-235-number", type: "number_input", options: [] }],
        },
        "view-300": {
            scenario:       "PREORD-02",
            "score-answer": "yes",
            severity:       3,
            periodicity:    "daily",
            category:       "during-milking",
            fields: [{ id: "view-300-select", type: "select", options: [] }],
        },
        "view-301": {
            scenario:       "PREORD-03",
            "score-answer": "yes",
            severity:       2,
            periodicity:    "weekly",
            category:       "milk-care",
            fields: [{ id: "view-301-select", type: "select", options: [] }],
        },
        "view-302": {
            scenario:       "PREORD-07",
            "score-answer": "yes",
            severity:       1,
            periodicity:    "monthly",
            category:       "health",
            fields: [{ id: "view-302-select", type: "select", options: [] }],
        },
        // Non-scoreable node — should be ignored.
        "view-user-profile-completed": {
            scenario:    "-",
            fields: [],
        },
    };

    const records = [
        // Shared-scenario interaction log from a single day.
        { id: "dc672055-7c5f-4864-8324-3086f68c39ed", nodeId: "view-109", scenario: "PREORD-02", answer: "yes", date: "2026-09-07", timestamp: 1788812185541, schemaVersion: 1 },
        { id: "992cdbe4-41bc-4809-bd30-88ae591b1e32", nodeId: "view-produce-year-round", scenario: "APP-SETUP", answer: "yes", date: "2026-09-07", timestamp: 1788812196716, schemaVersion: 1 },
        { id: "7ec32ed1-da0e-4088-9116-a6255c6354a4", nodeId: "view-animal-count", scenario: "APP-SETUP", answer: 100, date: "2026-09-07", timestamp: 1788812200011, schemaVersion: 1 },
        { id: "8c75cbb3-3760-4aec-99bc-97d7553bb70b", nodeId: "view-milking-method", scenario: "APP-SETUP", answer: "manual", date: "2026-09-07", timestamp: 1788812200826, schemaVersion: 1 },
        { id: "81747452-fc10-4132-9620-9782b580457f", nodeId: "view-124", scenario: "PREORD-03", answer: "yes", date: "2026-09-07", timestamp: 1788812204161, schemaVersion: 1 },
        { id: "dfd12e4c-6ade-4045-a5e0-01a2813b7b6a", nodeId: "view-235", scenario: "PREORD-07", answer: 50, date: "2026-09-07", timestamp: 1788812207382, schemaVersion: 1 },
        { id: "6d5bdc67-a3f2-4c99-bc4b-db393686e136", nodeId: "view-233", scenario: "PREORD-07", answer: "yes", date: "2026-09-07", timestamp: 1788812209681, schemaVersion: 1 },
        { id: "60771146-5647-424b-bc4b-1d2d15f8eec5", nodeId: "view-234", scenario: "PREORD-07", answer: "no", date: "2026-09-07", timestamp: 1788812211194, schemaVersion: 1 },
    ];

    it("computes byScenario correctly for shared scenarios", () => {
        const { byScenario } = computeFullScore(records, nodes);
        expect(byScenario["view-233"].nodeId).toBe("view-233");
        expect(byScenario["view-233"].scenario).toBe("PREORD-07");
        expect(byScenario["view-233"].pec).toBe(1);
        expect(byScenario["view-233"].mr).toBe(0);
        expect(byScenario["view-233"].pecCategory).toBe("always");

        expect(byScenario["view-234"].nodeId).toBe("view-234");
        expect(byScenario["view-234"].scenario).toBe("PREORD-07");
        expect(byScenario["view-234"].pec).toBe(1);
        expect(byScenario["view-234"].mr).toBe(0);
        expect(byScenario["view-234"].pecCategory).toBe("always");

        expect(byScenario["view-235"]).toBeUndefined();
        expect(byScenario["view-300"]).toBeUndefined();
        expect(byScenario["view-301"]).toBeUndefined();
        expect(byScenario["view-302"]).toBeUndefined();
    });

    it("computes byCategory with averaged MR", () => {
        const { byCategory } = computeFullScore(records, nodes);
        const cat = byCategory["before-milking"];
        // Two scored questions on the same day, both correct → average MR 0 → excellent.
        expect(cat.avgMR).toBe(0);
        expect(cat.rating).toBe("excellent");
        expect(cat.resultViewId).toBe("view-result-excellent");
    });

    it("ignores scoreable nodes with no records when many are present", () => {
        const extraNodes = {
            ...nodes,
            "view-400": {
                scenario:       "FEED-01",
                "score-answer": "yes",
                severity:       3,
                periodicity:    "daily",
                category:       "food",
                fields: [{ id: "view-400-select", type: "select", options: [] }],
            },
            "view-401": {
                scenario:       "FACIL-01",
                "score-answer": "yes",
                severity:       3,
                periodicity:    "weekly",
                category:       "facilities",
                fields: [{ id: "view-401-select", type: "select", options: [] }],
            },
            "view-402": {
                scenario:       "SUPPLY-01",
                "score-answer": "yes",
                severity:       2,
                periodicity:    "monthly",
                category:       "supplies",
                fields: [{ id: "view-402-select", type: "select", options: [] }],
            },
        };

        const { byScenario, byCategory } = computeFullScore(records, extraNodes);
        expect(byScenario["view-400"]).toBeUndefined();
        expect(byScenario["view-401"]).toBeUndefined();
        expect(byScenario["view-402"]).toBeUndefined();
        expect(byCategory["before-milking"].rating).toBe("excellent");
    });

    it("ignores non-scoreable nodes", () => {
        const { byScenario } = computeFullScore(records, nodes);
        expect(byScenario["view-user-profile-completed"]).toBeUndefined();
    });

    it("handles empty log gracefully", () => {
        const { byScenario, byCategory } = computeFullScore([], nodes);
        expect(byScenario["view-233"]).toBeUndefined();
        expect(byScenario["view-234"]).toBeUndefined();
        expect(Object.keys(byCategory).length).toBe(0);
    });
});
