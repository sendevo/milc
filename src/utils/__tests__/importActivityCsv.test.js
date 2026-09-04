import { describe, expect, it, vi } from "vitest";
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

    it("skips malformed rows without crashing", () => {
        const rows = parseActivityCsv(`Date (DD-MM-YYYY),View ID,Answer\n05-09-2026,view-213,yes\ninvalid`);

        expect(rows).toEqual([
            { date: "2026-09-05", nodeId: "view-213", answer: "yes" },
        ]);
    });

    it("replaces commas in exported CSV text with spaces", () => {
        const originalDocument = global.document;
        const originalURL = global.URL;
        const originalBlob = global.Blob;

        const createElement = vi.fn(() => ({
            href: "",
            download: "",
            style: {},
            click: vi.fn(),
            remove: vi.fn(),
        }));

        global.document = {
            body: { appendChild: vi.fn() },
            createElement,
        };
        global.URL = {
            createObjectURL: vi.fn((blob) => `blob:${blob?.size ?? 0}`),
            revokeObjectURL: vi.fn(),
        };
        global.Blob = class Blob {
            constructor(parts, options = {}) {
                this.parts = parts;
                this.type = options.type;
                this.size = parts.join("").length;
            }
        };

        try {
            exportActivityCsv({
                records: [{ timestamp: 1720000000000, nodeId: "view-1", answer: "yes, no" }],
                inventoryRecords: [],
                nodes: {
                    "view-1": {
                        title: { en: "Title, subtitle", es: "Titulo, subtitulo" },
                        subtitle: { en: "Sub, title", es: "Sub, titulo" },
                        scenario: "TEST" },
                },
                t: (key) => ({
                    "activityExport.dateTime": "Date",
                    "activityExport.pageNumber": "Page",
                    "activityExport.pageTitle": "Title",
                    "activityExport.pageSubtitle": "Subtitle",
                    "activityExport.answer": "Answer",
                    "activityExport.fileName": "activity",
                })[key] ?? key,
                language: "en",
            });

            const csvText = global.URL.createObjectURL.mock.calls[0][0].parts[0];
            expect(csvText).toContain("yes no");
            expect(csvText).not.toContain("yes, no");
            expect(csvText).toContain("Title subtitle");
            expect(csvText).not.toContain("Title, subtitle");
        } finally {
            global.document = originalDocument;
            global.URL = originalURL;
            global.Blob = originalBlob;
        }
    });
});
