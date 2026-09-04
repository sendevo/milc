import { t as resolveNodeText } from "../model";
import { computeFullScore } from "../model/scoring";
import { buildScoredAspects } from "../model/aspects";
import {
    formatAsIsoDate,
    getDaysBetweenInclusive,
    getMonthSpanInclusive,
} from "./dateTime";
import { buildEffectiveHerdSizeByDate } from "./herdInventory";
import {
    MASTITIS_NODE_IDS,
    MILK_LITERS_NODE_ID,
    MILKED_ANIMALS_NODE_IDS,
    MONTH_KEYS,
    TOTAL_ANIMALS_NODE_IDS,
} from "../constants/constants";

export const filterRecordsByRange = (records, from, to) => {
    if (!from || !to || from > to) return records;
    const fromIso = formatAsIsoDate(from);
    const toIso = formatAsIsoDate(to);
    return records.filter((record) => record.date >= fromIso && record.date <= toIso);
};

export const buildLatestMilkByDate = (records, startDate, endDate) => {
    if (!startDate || !endDate || startDate > endDate) return {};

    const fromIso = formatAsIsoDate(startDate);
    const toIso = formatAsIsoDate(endDate);
    const latestByDate = {};

    for (const record of records) {
        if (record.nodeId !== MILK_LITERS_NODE_ID) continue;
        if (!record.date || record.date < fromIso || record.date > toIso) continue;

        const value = Number(record.answer);
        if (!Number.isFinite(value)) continue;

        const timestamp = Number(record.timestamp) || 0;
        const previous = latestByDate[record.date];
        if (!previous || timestamp >= previous.timestamp) {
            latestByDate[record.date] = { value, timestamp };
        }
    }

    const valuesByDate = {};
    for (const [date, entry] of Object.entries(latestByDate)) {
        valuesByDate[date] = entry.value;
    }

    return valuesByDate;
};

export const buildEffectiveAnimalsByDate = (records, inventoryRecords, startDate, endDate) => {
    return buildEffectiveHerdSizeByDate(records, inventoryRecords, startDate, endDate);
};

export const buildSeries = (startDate, endDate, language, valuesByDate) => {
    if (!startDate || !endDate || startDate > endDate) return [];

    const days = [];
    const totalDays = getDaysBetweenInclusive(startDate, endDate);
    const shouldGroupByMonth = totalDays > 31;
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const finalDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const monthFormatter = new Intl.DateTimeFormat(language || "es", {
        month: "short",
        year: "2-digit",
    });

    while (cursor <= finalDate) {
        const year = cursor.getFullYear();
        const month = cursor.getMonth();
        const day = cursor.getDate();
        const isoDate = formatAsIsoDate(cursor);
        const value = Number(valuesByDate[isoDate] ?? 0);

        if (!shouldGroupByMonth) {
            days.push({
                key: `${year}-${month + 1}-${day}`,
                label: String(day).padStart(2, "0"),
                value,
            });
        } else {
            const monthKey = `${year}-${month + 1}`;
            const existing = days[days.length - 1];
            if (existing && existing.key === monthKey) {
                existing.value = Number((existing.value + value).toFixed(1));
            } else {
                days.push({
                    key: monthKey,
                    label: monthFormatter.format(cursor),
                    value,
                });
            }
        }

        cursor.setDate(cursor.getDate() + 1);
    }

    return days;
};

export const buildEffectiveValuesByDate = (records, nodeIds, startDate, endDate) => {
    if (!startDate || !endDate || startDate > endDate) return {};

    const fromIso = formatAsIsoDate(startDate);
    const toIso = formatAsIsoDate(endDate);
    const trackedIds = new Set(nodeIds);
    const latestByDate = {};
    let latestBeforeStart = null;

    for (const record of records) {
        if (!trackedIds.has(record.nodeId)) continue;
        if (!record.date || record.date > toIso) continue;

        const value = Number(record.answer);
        if (!Number.isFinite(value) || value < 0) continue;

        const timestamp = Number(record.timestamp) || 0;
        if (record.date < fromIso) {
            if (
                !latestBeforeStart ||
                record.date > latestBeforeStart.date ||
                (record.date === latestBeforeStart.date && timestamp >= latestBeforeStart.timestamp)
            ) {
                latestBeforeStart = { date: record.date, value, timestamp };
            }
            continue;
        }

        const previous = latestByDate[record.date];
        if (!previous || timestamp >= previous.timestamp) {
            latestByDate[record.date] = { value, timestamp };
        }
    }

    const valuesByDate = {};
    let latestKnownValue = latestBeforeStart?.value ?? 0;
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const finalDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    while (cursor <= finalDate) {
        const isoDate = formatAsIsoDate(cursor);
        const entry = latestByDate[isoDate];

        if (entry) {
            latestKnownValue = entry.value;
        }

        valuesByDate[isoDate] = latestKnownValue;
        cursor.setDate(cursor.getDate() + 1);
    }

    return valuesByDate;
};

export const buildLatestValuesByDate = (records, nodeIds, startDate, endDate) => {
    if (!startDate || !endDate || startDate > endDate) return {};

    const fromIso = formatAsIsoDate(startDate);
    const toIso = formatAsIsoDate(endDate);
    const trackedIds = new Set(nodeIds);
    const latestByDate = {};

    for (const record of records) {
        if (!trackedIds.has(record.nodeId)) continue;
        if (!record.date || record.date < fromIso || record.date > toIso) continue;

        const value = Number(record.answer);
        if (!Number.isFinite(value) || value < 0) continue;

        const timestamp = Number(record.timestamp) || 0;
        const previous = latestByDate[record.date];
        if (!previous || timestamp >= previous.timestamp) {
            latestByDate[record.date] = { value, timestamp };
        }
    }

    const valuesByDate = {};
    for (const [date, entry] of Object.entries(latestByDate)) {
        valuesByDate[date] = entry.value;
    }

    return valuesByDate;
};

export const buildChartBuckets = (startDate, endDate, language, totalByDate, milkedByDate) => {
    if (!startDate || !endDate || startDate > endDate) return [];

    const shouldGroupByMonth = getDaysBetweenInclusive(startDate, endDate) > 31;
    const monthFormatter = new Intl.DateTimeFormat(language || "es", {
        month: "short",
        year: "2-digit",
    });
    const buckets = [];
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const finalDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    while (cursor <= finalDate) {
        const year = cursor.getFullYear();
        const month = cursor.getMonth();
        const day = cursor.getDate();
        const isoDate = formatAsIsoDate(cursor);
        const total = Number(totalByDate[isoDate] ?? 0);
        const milked = Number(milkedByDate[isoDate] ?? 0);

        if (!shouldGroupByMonth) {
            buckets.push({
                key: `${year}-${month + 1}-${day}`,
                label: String(day).padStart(2, "0"),
                total,
                milked,
            });
        } else {
            const monthKey = `${year}-${month + 1}`;
            const existing = buckets[buckets.length - 1];
            if (existing && existing.key === monthKey) {
                existing.totalSum += total;
                existing.milkedSum += milked;
                existing.days += 1;
                existing.total = Number((existing.totalSum / existing.days).toFixed(1));
                existing.milked = Number((existing.milkedSum / existing.days).toFixed(1));
            } else {
                buckets.push({
                    key: monthKey,
                    label: monthFormatter.format(cursor),
                    total,
                    milked,
                    totalSum: total,
                    milkedSum: milked,
                    days: 1,
                });
            }
        }

        cursor.setDate(cursor.getDate() + 1);
    }

    return buckets.map(({ totalSum, milkedSum, days, ...bucket }) => bucket);
};

export const averageByDate = (valuesByDate) => {
    const values = Object.values(valuesByDate).map(Number);
    if (!values.length) return 0;
    const sum = values.reduce((acc, value) => acc + value, 0);
    return Number((sum / values.length).toFixed(1));
};

export const computeLitersPerAnimal = (from, to, milkValuesByDate, animalsByDate) => {
    if (!from || !to || from > to) return 0;

    const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const finalDate = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    let totalDailyLitersPerAnimal = 0;
    let daysWithAnimals = 0;

    while (cursor <= finalDate) {
        const isoDate = formatAsIsoDate(cursor);
        const milkValue = Number(milkValuesByDate[isoDate] ?? 0);
        const animalsCount = Number(animalsByDate[isoDate]);

        if (Number.isFinite(animalsCount) && animalsCount > 0) {
            totalDailyLitersPerAnimal += milkValue / animalsCount;
            daysWithAnimals += 1;
        }

        cursor.setDate(cursor.getDate() + 1);
    }

    if (!daysWithAnimals) return 0;
    return Number((totalDailyLitersPerAnimal / daysWithAnimals).toFixed(2));
};

export const computeReportStats = (records, inventoryRecords, from, to, language) => {
    const totalAnimalsByDate = buildEffectiveHerdSizeByDate(records, inventoryRecords, from, to);
    const milkedAnimalsByDate = buildEffectiveValuesByDate(records, MILKED_ANIMALS_NODE_IDS, from, to);
    const milkValuesByDate = buildLatestMilkByDate(records, from, to);
    const mastitisByDate = buildLatestValuesByDate(records, MASTITIS_NODE_IDS, from, to);

    const dairyBuckets = buildChartBuckets(from, to, language, totalAnimalsByDate, milkedAnimalsByDate);
    const milkSeries = buildSeries(from, to, language, milkValuesByDate);

    const totalDaysInRange = from && to && from <= to ? getDaysBetweenInclusive(from, to) : 0;
    const monthsInRange = from && to && from <= to ? getMonthSpanInclusive(from, to) : 0;

    const totalLiters = Number(milkSeries.reduce((sum, item) => sum + item.value, 0).toFixed(1));
    const averageLitersPerDay = totalDaysInRange
        ? Number((totalLiters / totalDaysInRange).toFixed(1))
        : 0;
    const averageLitersPerMonth = monthsInRange
        ? Number((totalLiters / monthsInRange).toFixed(1))
        : 0;

    const litersPerAnimal = computeLitersPerAnimal(
        from,
        to,
        milkValuesByDate,
        buildEffectiveAnimalsByDate(records, inventoryRecords, from, to),
    );

    const dailyRows = [];
    if (from && to && from <= to) {
        const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
        const finalDate = new Date(to.getFullYear(), to.getMonth(), to.getDate());

        while (cursor <= finalDate) {
            const isoDate = formatAsIsoDate(cursor);
            dailyRows.push({
                date: isoDate,
                totalAnimals: Number(totalAnimalsByDate[isoDate] ?? 0),
                milkedAnimals: Number(milkedAnimalsByDate[isoDate] ?? 0),
                processedLiters: Number(milkValuesByDate[isoDate] ?? 0),
                mastitisAnimals: Number(mastitisByDate[isoDate] ?? 0),
            });
            cursor.setDate(cursor.getDate() + 1);
        }
    }

    return {
        dairyBuckets,
        milkSeries,
        totalAnimalsByDate,
        milkedAnimalsByDate,
        milkValuesByDate,
        totalLiters,
        averageTotalAnimals: averageByDate(totalAnimalsByDate),
        averageMilkedAnimals: averageByDate(milkedAnimalsByDate),
        averageLitersPerDay,
        averageLitersPerMonth,
        litersPerAnimal,
        dailyRows,
    };
};

const cleanRichText = (value) => {
    if (!value) return "";
    return String(value)
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+\n/g, "\n")
        .replace(/\n\s+/g, "\n")
        .trim();
};

const resolveSetupValueLabel = (node, answer, t) => {
    if (!node || answer === undefined || answer === null) return "-";
    for (const field of node.fields || []) {
        if (field.type === "select") {
            const option = (field.options || []).find((opt) => opt.value === answer);
            if (option) return resolveNodeText(option.label);
        }
        if (field.type === "month_picker" && Array.isArray(answer)) {
            return answer
                .slice()
                .sort((a, b) => a - b)
                .map((monthIndex) => t(`survey.months.${MONTH_KEYS[monthIndex - 1]}`))
                .join(", ");
        }
    }
    return String(answer);
};

const findNodeIdByFieldId = (nodes, fieldId) => {
    return Object.keys(nodes).find((nodeId) =>
        (nodes[nodeId]?.fields || []).some((field) => field?.id === fieldId),
    );
};

const getLatestRecordByNodeId = (records, nodeId) => {
    if (!nodeId) return null;
    return records
        .filter((record) => record.scenario === "APP-SETUP" && record.nodeId === nodeId)
        .sort((a, b) => b.timestamp - a.timestamp)[0] ?? null;
};

export const buildSetupData = (nodes, records, t) => {
    const milkingMethodNodeId = findNodeIdByFieldId(nodes, "milk-select");
    const milkingRoomNodeId = findNodeIdByFieldId(nodes, "view-milking-room-select");

    const milkingMethodRecord = getLatestRecordByNodeId(records, milkingMethodNodeId);
    const milkingRoomRecord = getLatestRecordByNodeId(records, milkingRoomNodeId);

    const milkingMethodNode = milkingMethodNodeId ? nodes[milkingMethodNodeId] : null;
    const milkingRoomNode = milkingRoomNodeId ? nodes[milkingRoomNodeId] : null;

    return {
        milkingMethod: resolveSetupValueLabel(milkingMethodNode, milkingMethodRecord?.answer, t),
        milkingRoom: resolveSetupValueLabel(milkingRoomNode, milkingRoomRecord?.answer, t),
    };
};

const extractResultMessage = (resultNode) => {
    if (!resultNode) return "";

    const lines = [];
    const subtitle = cleanRichText(resolveNodeText(resultNode.subtitle));
    if (subtitle) lines.push(subtitle);

    for (const field of resultNode.fields || []) {
        if (field.type === "text_block" || field.type === "alert") {
            const text = cleanRichText(resolveNodeText(field.message));
            if (text) lines.push(text);
            continue;
        }

        if (field.type === "select") {
            const optionLabels = (field.options || [])
                .map((option) => cleanRichText(resolveNodeText(option.label)))
                .filter(Boolean);
            if (optionLabels.length > 0) {
                lines.push(optionLabels.join("; "));
            }
        }
    }

    return lines.join("\n");
};

export const buildSafetyData = (records, nodes, from, to, t) => {
    const filteredRecords = filterRecordsByRange(records, from, to);
    const score = computeFullScore(filteredRecords, nodes);
    const aspects = buildScoredAspects(score, t);

    return aspects.map((aspect) => {
        if (!aspect.targetView) {
            return {
                ...aspect,
                detailMessage: t("resultScales.notEvaluated"),
            };
        }

        const node = nodes[aspect.targetView];
        const detailMessage = extractResultMessage(node) || t("resultScales.notEvaluated");

        return {
            ...aspect,
            detailMessage,
        };
    });
};
