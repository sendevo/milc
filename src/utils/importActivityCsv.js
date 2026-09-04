const HEADER_ALIASES = {
    "date (dd-mm-yyyy)": "date",
    "date": "date",
    "view id": "nodeId",
    "viewid": "nodeId",
    "answer": "answer",
};

const parseCsvRow = (line) => {
    const cells = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];

        if (char === '"') {
            if (inQuotes && line[index + 1] === '"') {
                current += '"';
                index += 1;
                continue;
            }
            inQuotes = !inQuotes;
            continue;
        }

        if (char === "," && !inQuotes) {
            cells.push(current);
            current = "";
            continue;
        }

        current += char;
    }

    cells.push(current);
    return cells.map((cell) => cell.trim());
};

const toIsoDate = (dateString) => {
    const value = String(dateString ?? "").trim();
    const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!match) {
        return "";
    }

    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
};

export const parseActivityCsv = (csvText) => {
    if (typeof csvText !== "string" || !csvText.trim()) {
        return [];
    }

    const normalized = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = normalized.split("\n").filter((line) => line.trim() !== "");
    if (lines.length < 2) {
        return [];
    }

    const header = parseCsvRow(lines[0]).map((column) => {
        const normalizedColumn = String(column ?? "").trim();
        return HEADER_ALIASES[normalizedColumn.toLowerCase()] ?? normalizedColumn.toLowerCase();
    });

    const rows = [];

    for (let index = 1; index < lines.length; index += 1) {
        const cells = parseCsvRow(lines[index]);
        if (cells.length < header.length) {
            continue;
        }

        const record = {};
        for (let columnIndex = 0; columnIndex < header.length; columnIndex += 1) {
            record[header[columnIndex]] = cells[columnIndex] ?? "";
        }

        const rawDate = record.date;
        const nodeId = String(record.nodeId ?? "").trim();
        const answer = String(record.answer ?? "").trim();
        const isoDate = toIsoDate(rawDate);

        if (!nodeId || !answer || !isoDate) {
            continue;
        }

        rows.push({
            date: isoDate,
            nodeId,
            answer,
        });
    }

    return rows;
};

export const importActivityCsv = ({ csvText, nodes = {}, saveAnswer }) => {
    if (typeof saveAnswer !== "function") {
        throw new TypeError("saveAnswer must be a function");
    }

    const rows = parseActivityCsv(csvText);
    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
        const node = nodes[row.nodeId];
        const scenario = node?.scenario;

        if (!node) {
            skipped += 1;
            console.warn(`Skipping row with unknown nodeId: ${row.nodeId}`);
            continue;
        }

        saveAnswer(row.nodeId, scenario, row.answer, { date: row.date });
        imported += 1;
    }

    return { imported, skipped };
};
