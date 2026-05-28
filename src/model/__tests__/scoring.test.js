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
} from "../model/scoring";

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

    it("weekly: 14 days → 2 occurrences", () => {
        expect(expectedOccurrences("weekly", 14)).toBe(2);
    });

    it("biweekly: 30 days → 2 occurrences", () => {
        expect(expectedOccurrences("biweekly", 30)).toBe(2);
    });

    it("monthly: 31 days → 1 occurrence", () => {
        expect(expectedOccurrences("monthly", 31)).toBe(1);
    });

    it("semester: 180 days → 1 occurrence", () => {
        expect(expectedOccurrences("semester", 180)).toBe(1);
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

    it("dont-know answers are excluded from scoring", () => {
        // 2 yes + 2 dont-know. Only the 2 yes days count.
        const records = makeRecords(["yes", "yes", "dont-know", "dont_know"]);
        const result  = computePEC(records, "yes", "daily");
        // 2 correct out of 2 expected days (dont-know days removed)
        expect(result.pec).toBe(1.0);
        expect(result.category).toBe("always");
    });

    it("returns never if no records", () => {
        const result = computePEC([], "yes", "daily");
        expect(result.pec).toBe(0);
        expect(result.category).toBe("never");
        expect(result.expected).toBe(0);
    });

    it("caps pec at 1.0 if correct > expected", () => {
        // 4 correct answers in 4 days but periodicity is weekly (expected=0 for <7 days)
        // Use 8 days so expected=1, but send 2 correct answers
        const records = [
            { scenario: "X", answer: "yes", date: "2026-01-01" },
            { scenario: "X", answer: "yes", date: "2026-01-08" },
        ];
        const result = computePEC(records, "yes", "weekly");
        expect(result.pec).toBeLessThanOrEqual(1.0);
    });
});

// ---------------------------------------------------------------------------
// computeMR
// ---------------------------------------------------------------------------

describe("computeMR", () => {
    it("always + S3 → 0.00", () => expect(computeMR("always", 3)).toBe(0.00));
    it("almostAlways + S3 → 0.37", () => expect(computeMR("almostAlways", 3)).toBe(0.37));
    it("sometimes + S2 → 0.77", () => expect(computeMR("sometimes", 2)).toBe(0.77));
    it("never + S1 → 0.67", () => expect(computeMR("never", 1)).toBe(0.67));
    it("never + S2 → 1.00", () => expect(computeMR("never", 2)).toBe(1.00));
    it("never + S3 → 1.00", () => expect(computeMR("never", 3)).toBe(1.00));
    it("unknown category → defaults to 1.0", () => expect(computeMR("unknown", 3)).toBe(1.0));
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
        "view-100": {
            scenario:       "PREORD-07",
            "score-answer": "yes",
            severity:       3,
            periodicity:    "daily",
            category:       "before-milking",
            fields: [{ id: "view-100-select", type: "select", options: [] }],
        },
        "view-109": {
            scenario:       "PREORD-02",
            "score-answer": "yes",
            severity:       3,
            periodicity:    "daily",
            category:       "before-milking",
            fields: [{ id: "udder_clean", type: "select", options: [] }],
        },
        // Non-scoreable node — should be ignored.
        "view-28": {
            scenario:    "-",
            fields: [],
        },
    };

    const records = [
        // PREORD-07: answered yes 3 of 3 days → always → MR 0.00
        { scenario: "PREORD-07", answer: "yes", date: "2026-01-01", timestamp: 1 },
        { scenario: "PREORD-07", answer: "yes", date: "2026-01-02", timestamp: 2 },
        { scenario: "PREORD-07", answer: "yes", date: "2026-01-03", timestamp: 3 },
        // PREORD-02: answered yes 1 of 3 days → sometimes → MR 0.90
        { scenario: "PREORD-02", answer: "yes", date: "2026-01-01", timestamp: 4 },
        { scenario: "PREORD-02", answer: "no",  date: "2026-01-02", timestamp: 5 },
        { scenario: "PREORD-02", answer: "no",  date: "2026-01-03", timestamp: 6 },
    ];

    it("computes byScenario correctly", () => {
        const { byScenario } = computeFullScore(records, nodes);
        expect(byScenario["PREORD-07"].mr).toBe(0.00);
        expect(byScenario["PREORD-07"].pecCategory).toBe("always");
        expect(byScenario["PREORD-02"].pecCategory).toBe("sometimes");
        expect(byScenario["PREORD-02"].mr).toBe(0.90);
    });

    it("computes byCategory with averaged MR", () => {
        const { byCategory } = computeFullScore(records, nodes);
        const cat = byCategory["before-milking"];
        // avg of 0.00 and 0.90 = 0.45 → very-good
        expect(cat.avgMR).toBeCloseTo(0.45);
        expect(cat.rating).toBe("very-good");
        expect(cat.resultViewId).toBe("view-result-good");
    });

    it("ignores non-scoreable nodes", () => {
        const { byScenario } = computeFullScore(records, nodes);
        expect(byScenario["-"]).toBeUndefined();
    });

    it("handles empty log gracefully", () => {
        const { byScenario, byCategory } = computeFullScore([], nodes);
        // All scenarios exist but with pec=0 (no records → expected=0 → never)
        expect(byScenario["PREORD-07"].pecCategory).toBe("never");
        expect(Object.keys(byCategory).length).toBeGreaterThan(0);
    });
});
