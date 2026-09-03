import { describe, expect, it } from "vitest";
import {
    buildEffectiveHerdSizeByDate,
    getEffectiveHerdSizeOnDate,
    getHerdInventoryRecordForNodeAndDate,
    withoutHerdInventoryRecordForNodeAndDate,
} from "../herdInventory";

const surveyRecords = [
    {
        nodeId: "view-220",
        scenario: "APP-SETUP",
        answer: 10,
        date: "2026-09-01",
        timestamp: 100,
    },
];

describe("herdInventory", () => {
    it("builds effective herd size using setup snapshot plus transactions", () => {
        const inventoryRecords = [
            {
                nodeId: "view-add-animals",
                type: "add",
                count: 3,
                date: "2026-09-02",
                timestamp: 200,
            },
            {
                nodeId: "view-dead-animals",
                type: "death",
                count: 2,
                date: "2026-09-03",
                timestamp: 300,
            },
        ];

        const result = buildEffectiveHerdSizeByDate(
            surveyRecords,
            inventoryRecords,
            new Date(2026, 8, 1),
            new Date(2026, 8, 4),
        );

        expect(result).toEqual({
            "2026-09-01": 10,
            "2026-09-02": 13,
            "2026-09-03": 11,
            "2026-09-04": 11,
        });
    });

    it("resets derived herd size when a later setup snapshot exists", () => {
        const result = buildEffectiveHerdSizeByDate(
            [
                ...surveyRecords,
                {
                    nodeId: "view-220",
                    scenario: "APP-SETUP",
                    answer: 20,
                    date: "2026-09-03",
                    timestamp: 400,
                },
            ],
            [
                {
                    nodeId: "view-add-animals",
                    type: "add",
                    count: 3,
                    date: "2026-09-02",
                    timestamp: 200,
                },
            ],
            new Date(2026, 8, 1),
            new Date(2026, 8, 4),
        );

        expect(result["2026-09-02"]).toBe(13);
        expect(result["2026-09-03"]).toBe(20);
        expect(result["2026-09-04"]).toBe(20);
    });

    it("returns effective herd size for a single day", () => {
        const result = getEffectiveHerdSizeOnDate(
            surveyRecords,
            [
                {
                    nodeId: "view-remove-animals",
                    type: "remove",
                    count: 4,
                    date: "2026-09-02",
                    timestamp: 200,
                },
            ],
            "2026-09-02",
        );

        expect(result).toBe(6);
    });

    it("finds and excludes the current node record for same-day edits", () => {
        const records = [
            {
                nodeId: "view-remove-animals",
                type: "remove",
                count: 2,
                date: "2026-09-02",
                timestamp: 200,
            },
            {
                nodeId: "view-dead-animals",
                type: "death",
                count: 1,
                date: "2026-09-02",
                timestamp: 300,
            },
        ];

        expect(getHerdInventoryRecordForNodeAndDate(records, "view-remove-animals", "2026-09-02")?.count).toBe(2);
        expect(withoutHerdInventoryRecordForNodeAndDate(records, "view-remove-animals", "2026-09-02")).toEqual([
            {
                nodeId: "view-dead-animals",
                type: "death",
                count: 1,
                date: "2026-09-02",
                timestamp: 300,
            },
        ]);
    });
});
