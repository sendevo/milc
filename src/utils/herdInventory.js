import { formatAsIsoDate } from "./dateTime";
import {
    HERD_INVENTORY_NODE_TYPES,
    HERD_INVENTORY_STORAGE_KEY,
    ISO_DATE_RE,
} from "../constants/constants";

export { HERD_INVENTORY_NODE_TYPES, HERD_INVENTORY_STORAGE_KEY };

const compareEvents = (left, right) => {
    if (left.date !== right.date) {
        return left.date.localeCompare(right.date);
    }

    const leftTimestamp = Number(left.timestamp) || 0;
    const rightTimestamp = Number(right.timestamp) || 0;
    if (leftTimestamp !== rightTimestamp) {
        return leftTimestamp - rightTimestamp;
    }

    if (left.kind === right.kind) {
        return 0;
    }

    return left.kind === "snapshot" ? -1 : 1;
};

const toFiniteNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const isValidIsoDate = (value) => typeof value === "string" && ISO_DATE_RE.test(value);

const buildSnapshotEvents = (surveyRecords = []) => {
    return surveyRecords
        .filter((record) => record?.nodeId === "view-220" && record?.scenario === "APP-SETUP")
        .map((record) => {
            const count = toFiniteNumber(record.answer);
            if (!isValidIsoDate(record.date) || count === null || count < 0) {
                return null;
            }

            return {
                kind: "snapshot",
                date: record.date,
                timestamp: Number(record.timestamp) || 0,
                count,
            };
        })
        .filter(Boolean);
};

const buildTransactionEvents = (inventoryRecords = []) => {
    return inventoryRecords
        .map((record) => {
            const count = toFiniteNumber(record.count);
            if (!isValidIsoDate(record?.date) || count === null || count < 0 || !record?.type) {
                return null;
            }

            return {
                kind: "transaction",
                type: record.type,
                date: record.date,
                timestamp: Number(record.timestamp) || 0,
                count,
            };
        })
        .filter(Boolean);
};

const applyEvent = (currentCount, event) => {
    if (event.kind === "snapshot") {
        return event.count;
    }

    if (!Number.isFinite(currentCount)) {
        return currentCount;
    }

    if (event.type === "add") {
        return currentCount + event.count;
    }

    if (event.type === "remove" || event.type === "death") {
        return Math.max(0, currentCount - event.count);
    }

    return currentCount;
};

const buildSortedEvents = (surveyRecords = [], inventoryRecords = []) => {
    return [
        ...buildSnapshotEvents(surveyRecords),
        ...buildTransactionEvents(inventoryRecords),
    ].sort(compareEvents);
};

export const isHerdInventoryNode = (nodeId) => Boolean(HERD_INVENTORY_NODE_TYPES[nodeId]);

export const getHerdInventoryTypeForNode = (nodeId) => HERD_INVENTORY_NODE_TYPES[nodeId] || null;

export const getHerdInventoryRecordForNodeAndDate = (records = [], nodeId, date) => {
    if (!nodeId || !isValidIsoDate(date)) {
        return null;
    }

    return records
        .filter((record) => record?.nodeId === nodeId && record?.date === date)
        .sort((left, right) => (Number(right.timestamp) || 0) - (Number(left.timestamp) || 0))[0] || null;
};

export const withoutHerdInventoryRecordForNodeAndDate = (records = [], nodeId, date) => {
    if (!nodeId || !isValidIsoDate(date)) {
        return [...records];
    }

    return records.filter((record) => !(record?.nodeId === nodeId && record?.date === date));
};

export const getEffectiveHerdSizeOnDate = (surveyRecords = [], inventoryRecords = [], effectiveDate) => {
    if (!isValidIsoDate(effectiveDate)) {
        return null;
    }

    const events = buildSortedEvents(surveyRecords, inventoryRecords);
    let currentCount = null;

    for (const event of events) {
        if (event.date > effectiveDate) {
            break;
        }
        currentCount = applyEvent(currentCount, event);
    }

    return Number.isFinite(currentCount) ? currentCount : null;
};

export const buildEffectiveHerdSizeByDate = (surveyRecords = [], inventoryRecords = [], startDate, endDate) => {
    if (!startDate || !endDate || startDate > endDate) {
        return {};
    }

    const events = buildSortedEvents(surveyRecords, inventoryRecords);
    const valuesByDate = {};
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const finalDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    let eventIndex = 0;
    let currentCount = null;

    while (cursor <= finalDate) {
        const isoDate = formatAsIsoDate(cursor);

        while (eventIndex < events.length && events[eventIndex].date <= isoDate) {
            currentCount = applyEvent(currentCount, events[eventIndex]);
            eventIndex += 1;
        }

        if (Number.isFinite(currentCount)) {
            valuesByDate[isoDate] = currentCount;
        }

        cursor.setDate(cursor.getDate() + 1);
    }

    return valuesByDate;
};
