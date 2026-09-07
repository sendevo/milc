import { describe, expect, it, vi } from "vitest";

const xlsxMocks = vi.hoisted(() => ({
    aoaToSheet: vi.fn(() => ({ sheet: true })),
    bookNew: vi.fn(() => ({ workbook: true })),
    bookAppendSheet: vi.fn(),
    writeFile: vi.fn(),
}));

vi.mock("xlsx", () => ({
    utils: {
        aoa_to_sheet: xlsxMocks.aoaToSheet,
        book_new: xlsxMocks.bookNew,
        book_append_sheet: xlsxMocks.bookAppendSheet,
    },
    writeFile: xlsxMocks.writeFile,
}));

import { importActivityCsv, parseActivityCsv } from "../importActivityCsv";
import { exportActivityCsv } from "../exportActivityCsv";

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

    it("sorts imported rows by date before saving", () => {
        const saved = [];

        importActivityCsv({
            csvText: `Date (DD-MM-YYYY),View ID,Answer\n06-09-2026,view-215,no\n05-09-2026,view-213,yes\n04-09-2026,view-214,maybe`,
            nodes: {
                "view-213": { scenario: "PLAGAS" },
                "view-214": { scenario: "PLAGAS" },
                "view-215": { scenario: "PLAGAS" },
            },
            saveAnswer: (nodeId, scenario, answer, options = {}) => {
                saved.push({ nodeId, scenario, answer, date: options.date });
            },
        });

        expect(saved).toEqual([
            { nodeId: "view-214", scenario: "PLAGAS", answer: "maybe", date: "2026-09-04" },
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

    it("exports activity rows to an xlsx workbook", () => {
    	xlsxMocks.aoaToSheet.mockClear();
	    xlsxMocks.bookNew.mockClear();
	    xlsxMocks.bookAppendSheet.mockClear();
	    xlsxMocks.writeFile.mockClear();

        exportActivityCsv({
            records: [{ timestamp: 1720000000000, date: "2026-07-29", nodeId: "view-1", answer: "yes, no" }],
            inventoryRecords: [],
            nodes: {
                "view-1": {
                    title: { en: "Title, subtitle", es: "Titulo, subtitulo" },
                    subtitle: { en: "Sub, title", es: "Sub, titulo" },
                    scenario: "TEST" },
            },
            t: (key) => ({
                "activityLog.title": "Activity",
                "activityExport.dateTime": "Date",
                "activityExport.pageNumber": "Page",
                "activityExport.pageTitle": "Title",
                "activityExport.pageSubtitle": "Subtitle",
                "activityExport.answer": "Answer",
                "activityExport.fileName": "activity",
            })[key] ?? key,
            language: "en",
        });

        expect(xlsxMocks.aoaToSheet).toHaveBeenCalledTimes(1);
        const [sheetRows] = xlsxMocks.aoaToSheet.mock.calls[0];
        expect(sheetRows[0]).toEqual(["Date", "Page", "Title", "Subtitle", "Answer"]);
        expect(sheetRows[1]).toEqual([
            expect.stringMatching(/^29-07-2026 \d{2}:\d{2}:\d{2}$/),
            "1",
            "Title, subtitle",
            "Sub, title",
            "yes, no",
        ]);
        expect(xlsxMocks.bookAppendSheet).toHaveBeenCalledWith(
            { workbook: true },
            expect.objectContaining({ sheet: true }),
            "Activity",
        );
        expect(xlsxMocks.writeFile).toHaveBeenCalledWith(
            { workbook: true },
            expect.stringMatching(/^activity_\d{8}_\d{6}\.xlsx$/),
            { compression: true },
        );
    });
});
