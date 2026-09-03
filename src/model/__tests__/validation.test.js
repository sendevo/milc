import { describe, it, expect } from "vitest";
import { validateSurveySubmission } from "../validation";

const t = (key) => key;

const baseRecords = [
    {
        nodeId: "view-220",
        scenario: "APP-SETUP",
        answer: 10,
        timestamp: 100,
    },
];

describe("validateSurveySubmission", () => {
    it("returns invalid when milked animals exceed total animals", () => {
        const result = validateSurveySubmission({
            nodeId: "view-235",
            answers: { "view-235-number": 11 },
            records: baseRecords,
            t,
        });

        expect(result.isValid).toBe(false);
        expect(result.ruleId).toBe("milked_animals_not_greater_than_total_animals");
        expect(result.message).toBe("survey.validation.milkedAnimalsExceedTotal");
    });

    it("returns valid when milked animals are equal to total animals", () => {
        const result = validateSurveySubmission({
            nodeId: "view-235",
            answers: { "view-235-number": 10 },
            records: baseRecords,
            t,
        });

        expect(result.isValid).toBe(true);
    });

    it("returns valid when there is no total animals reference yet", () => {
        const result = validateSurveySubmission({
            nodeId: "view-235",
            answers: { "view-235-number": 99 },
            records: [],
            t,
        });

        expect(result.isValid).toBe(true);
    });

    it("returns valid for nodes without matching validation rules", () => {
        const result = validateSurveySubmission({
            nodeId: "view-109",
            answers: { udder_clean: "yes" },
            records: baseRecords,
            t,
        });

        expect(result.isValid).toBe(true);
    });

    it("uses latest APP-SETUP total animals record", () => {
        const records = [
            ...baseRecords,
            {
                nodeId: "view-220",
                scenario: "APP-SETUP",
                answer: 8,
                timestamp: 200,
            },
        ];

        const result = validateSurveySubmission({
            nodeId: "view-235",
            answers: { "view-235-number": 9 },
            records,
            t,
        });

        expect(result.isValid).toBe(false);
    });

    it("returns invalid when sick animals exceed latest milked animals", () => {
        const records = [
            ...baseRecords,
            {
                nodeId: "view-235",
                scenario: "PREORD-07",
                answer: 6,
                timestamp: 300,
            },
        ];

        const result = validateSurveySubmission({
            nodeId: "view-236",
            answers: { "view-235-number": 7 },
            records,
            t,
        });

        expect(result.isValid).toBe(false);
        expect(result.ruleId).toBe("sick_animals_not_greater_than_milked_animals");
        expect(result.message).toBe("survey.validation.sickAnimalsExceedMilked");
    });

    it("returns valid when sick animals are not greater than latest milked animals", () => {
        const records = [
            ...baseRecords,
            {
                nodeId: "view-235",
                scenario: "PREORD-07",
                answer: 6,
                timestamp: 300,
            },
        ];

        const result = validateSurveySubmission({
            nodeId: "view-236",
            answers: { "view-235-number": 6 },
            records,
            t,
        });

        expect(result.isValid).toBe(true);
    });

    it("returns valid for view-236 when there is no previous milked animals record", () => {
        const result = validateSurveySubmission({
            nodeId: "view-236",
            answers: { "view-235-number": 5 },
            records: baseRecords,
            t,
        });

        expect(result.isValid).toBe(true);
    });

    it("uses derived herd stock when inventory transactions reduce current total", () => {
        const result = validateSurveySubmission({
            nodeId: "view-235",
            answers: { "view-235-number": 9 },
            records: [
                {
                    ...baseRecords[0],
                    date: "2026-09-01",
                },
            ],
            inventoryRecords: [
                {
                    nodeId: "view-remove-animals",
                    type: "remove",
                    count: 2,
                    date: "2026-09-02",
                    timestamp: 200,
                },
            ],
            currentDate: "2026-09-02",
            t,
        });

        expect(result.isValid).toBe(false);
        expect(result.ruleId).toBe("milked_animals_not_greater_than_total_animals");
    });

    it("prevents herd stock transactions from going negative", () => {
        const result = validateSurveySubmission({
            nodeId: "view-remove-animals",
            answers: { "view-remove-animals-number": 12 },
            records: [
                {
                    ...baseRecords[0],
                    date: "2026-09-01",
                },
            ],
            inventoryRecords: [],
            currentDate: "2026-09-02",
            t,
        });

        expect(result.isValid).toBe(false);
        expect(result.ruleId).toBe("herd_inventory_cannot_go_negative");
        expect(result.message).toBe("survey.validation.herdStockCannotGoNegative");
    });

    it("allows replacing a same-day herd removal record with a larger valid value", () => {
        const result = validateSurveySubmission({
            nodeId: "view-remove-animals",
            answers: { "view-remove-animals-number": 9 },
            records: [
                {
                    ...baseRecords[0],
                    date: "2026-09-01",
                },
            ],
            inventoryRecords: [
                {
                    nodeId: "view-remove-animals",
                    type: "remove",
                    count: 2,
                    date: "2026-09-02",
                    timestamp: 200,
                },
            ],
            currentDate: "2026-09-02",
            t,
        });

        expect(result.isValid).toBe(true);
    });
});
