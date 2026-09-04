import { describe, expect, it } from "vitest";
import { importActivityCsv, parseActivityCsv } from "../importActivityCsv";

describe("importActivityCsv", () => {
    it("parses the expected log CSV and resolves each view to its scenario", () => {
        const saved = [];
        const result = importActivityCsv({
            csvText: `Date (DD-MM-YYYY),View ID,Answer\n05-09-2026,view-213,yes\n06-09-2026,view-215,no`,
            nodes: {
                "view-213": { scenario: "PLAGAS" },
                "view-215": { scenario: "PLAGAS" },
            },
            saveAnswer: (nodeId, scenario, answer, options = {}) => {
                saved.push({ nodeId, scenario, answer, date: options.date });
            },
        });

        expect(result.imported).toBe(2);
        expect(result.skipped).toBe(0);
        expect(saved).toEqual([
            { nodeId: "view-213", scenario: "PLAGAS", answer: "yes", date: "2026-09-05" },
            { nodeId: "view-215", scenario: "PLAGAS", answer: "no", date: "2026-09-06" },
        ]);
    });

    it("skips malformed rows without crashing", () => {
        const rows = parseActivityCsv(`Date (DD-MM-YYYY),View ID,Answer\n05-09-2026,view-213,yes\ninvalid`);

        expect(rows).toEqual([
            { date: "2026-09-05", nodeId: "view-213", answer: "yes" },
        ]);
    });
});
