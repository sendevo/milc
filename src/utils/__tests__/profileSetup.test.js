import { describe, expect, it } from "vitest";
import {
    cleanConflictingProfileSetupRecords,
    formatMonthList,
    isNoMilkAllYearAnswer,
    isYesMilkAllYearAnswer,
} from "../profileSetup";

describe("profileSetup", () => {
    it("detects the no-all-year answer from survey data", () => {
        expect(isNoMilkAllYearAnswer("No")).toBe(true);
        expect(isNoMilkAllYearAnswer("yes")).toBe(false);
    });

    it("detects the yes-all-year answer from survey data", () => {
        expect(isYesMilkAllYearAnswer("yes")).toBe(true);
        expect(isYesMilkAllYearAnswer("Yes")).toBe(true);
    });

    it("removes stale same-day conflicting profile setup records", () => {
        const records = [
            { nodeId: "view-produce-year-round", scenario: "APP-SETUP", date: "2026-09-04", answer: "yes", timestamp: 1 },
            { nodeId: "view-milking-calendar", scenario: "APP-SETUP", date: "2026-09-04", answer: [1, 2, 3], timestamp: 2 },
            { nodeId: "view-217", scenario: "APP-SETUP", date: "2026-09-04", answer: "yes", timestamp: 3 },
            { nodeId: "view-milking-method", scenario: "APP-SETUP", date: "2026-09-04", answer: "manual", timestamp: 4 },
        ];

        expect(cleanConflictingProfileSetupRecords(records, "view-produce-year-round", "APP-SETUP", "2026-09-04")).toEqual([
            { nodeId: "view-produce-year-round", scenario: "APP-SETUP", date: "2026-09-04", answer: "yes", timestamp: 1 },
            { nodeId: "view-milking-method", scenario: "APP-SETUP", date: "2026-09-04", answer: "manual", timestamp: 4 },
        ]);
    });

    it("formats month arrays into a readable list", () => {
        const t = (key) => ({
            "survey.months.jan": "Jan",
            "survey.months.feb": "Feb",
            "survey.months.mar": "Mar",
        }[key] ?? key);

        expect(formatMonthList([1, 2, 3], t)).toBe("Jan, Feb, Mar");
    });
});
