import { getSpecialSurveyViewExportMeta } from "../pages/specialViews";
import { MONTH_KEYS } from "../constants";

const csvEscape = (value) => {
    if (value === null || value === undefined) return "";

    const text = String(value);
    if (/[",\n\r]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
};

const getLocalizedText = (text, language) => {
    if (!text || typeof text !== "object") {
        return text ?? "";
    }

    const lang = language?.slice(0, 2) || "es";
    return text[lang] ?? text.en ?? text.es ?? "";
};

const getNodeNumber = (nodeId) => {
    const match = String(nodeId || "").match(/view-(\d+)/i);
    return match ? match[1] : "";
};

const formatDateTime = (timestamp, fallbackDate) => {
    const date = Number.isFinite(Number(timestamp)) ? new Date(Number(timestamp)) : null;

    if (date && !Number.isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    }

    if (typeof fallbackDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fallbackDate)) {
        const [year, month, day] = fallbackDate.split("-");
        return `${day}-${month}-${year}`;
    }

    return "";
};

const formatIsoDate = (value) => {
    if (typeof value !== "string") return String(value ?? "");
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return value;
    return `${match[3]}-${match[2]}-${match[1]}`;
};

const resolveTrackedField = (node) => {
    if (!node?.fields || !Array.isArray(node.fields)) {
        return null;
    }

    return node.fields.find(
        (field) =>
            field.type === "select" ||
            field.type === "number_input" ||
            field.type === "month_picker" ||
            field.type === "date_picker",
    ) || null;
};

const formatMonthAnswer = (answer, t) => {
    if (!Array.isArray(answer)) {
        return String(answer ?? "");
    }

    return answer
        .map((monthNumber) => {
            const key = MONTH_KEYS[Number(monthNumber) - 1];
            return key ? t(`survey.months.${key}`) : String(monthNumber);
        })
        .join(", ");
};

const formatAnswer = (record, node, t) => {
    const field = resolveTrackedField(node);
    const answer = record?.answer;

    if (!field) {
        return Array.isArray(answer) ? answer.join(", ") : String(answer ?? "");
    }

    if (field.type === "select") {
        const option = field.options?.find((item) => item.value === answer);
        return option ? getLocalizedText(option.label) : String(answer ?? "");
    }

    if (field.type === "month_picker") {
        return formatMonthAnswer(answer, t);
    }

    if (field.type === "date_picker") {
        return formatIsoDate(answer);
    }

    return Array.isArray(answer) ? answer.join(", ") : String(answer ?? "");
};

const buildHeaders = (t) => ([
    t("activityExport.dateTime"),
    t("activityExport.pageNumber"),
    t("activityExport.pageTitle"),
    t("activityExport.pageSubtitle"),
    t("activityExport.answer"),
]);

const normalizeInventoryRecords = (inventoryRecords = []) => {
    return inventoryRecords.map((record) => ({
        ...record,
        answer: record.count,
    }));
};

const buildRows = ({ records, inventoryRecords, nodes, t, language }) => {
    return [...records, ...normalizeInventoryRecords(inventoryRecords)]
        .sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0))
        .map((record) => {
            const node = nodes?.[record.nodeId] || null;
            const specialMeta = getSpecialSurveyViewExportMeta(record.nodeId);
            const title = node?.title
                ? getLocalizedText(node.title, language)
                : getLocalizedText(specialMeta?.title, language);
            const subtitle = node?.subtitle
                ? getLocalizedText(node.subtitle, language)
                : getLocalizedText(specialMeta?.subtitle, language);

            return [
                formatDateTime(record.timestamp, record.date),
                getNodeNumber(record.nodeId),
                title,
                subtitle,
                formatAnswer(record, node, t),
            ];
        });
};

const toCsv = (headers, rows) => {
    const lines = [headers.map(csvEscape).join(",")];

    for (const row of rows) {
        lines.push(row.map(csvEscape).join(","));
    }

    return lines.join("\n");
};

const downloadCsv = (content, filename) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

const buildFilename = (t) => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${t("activityExport.fileName")}_${yyyy}${mm}${dd}_${hh}${mi}${ss}.csv`;
};

export const exportActivityCsv = ({ records, inventoryRecords = [], nodes, t, language }) => {
    const headers = buildHeaders(t);
    const rows = buildRows({ records, inventoryRecords, nodes, t, language });
    const csv = toCsv(headers, rows);
    downloadCsv(csv, buildFilename(t));
};
