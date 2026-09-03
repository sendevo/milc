import { useCallback, useEffect, useState } from "react";
import { getJSONItem, setJSONItem } from "../utils/persistentStorage";
import { HERD_INVENTORY_STORAGE_KEY } from "../utils/herdInventory";

const HERD_INVENTORY_SCHEMA_VERSION = 1;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const localDateString = () => {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const resolveEffectiveDate = (date) => {
    if (typeof date === "string" && ISO_DATE_RE.test(date)) {
        return date;
    }

    return localDateString();
};

const readLog = async () => {
    const parsed = await getJSONItem(HERD_INVENTORY_STORAGE_KEY, []);
    return Array.isArray(parsed) ? parsed : [];
};

const writeLog = async (records) => {
    try {
        await setJSONItem(HERD_INVENTORY_STORAGE_KEY, records);
    } catch (err) {
        console.error("[useHerdInventory] Failed to write log:", err);
    }
};

export const useHerdInventory = () => {
    const [records, setRecords] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const hydrate = async () => {
            const persisted = await readLog();
            if (isMounted) {
                setRecords(persisted);
            }
        };

        hydrate();

        return () => {
            isMounted = false;
        };
    }, []);

    const saveTransaction = useCallback((nodeId, type, count, options = {}) => {
        if (!nodeId || !type) return;

        const numericCount = Number(count);
        if (!Number.isFinite(numericCount) || numericCount < 0) return;

        const effectiveDate = resolveEffectiveDate(options.date);
        const record = {
            id: typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : String(Date.now()),
            nodeId,
            type,
            count: numericCount,
            date: effectiveDate,
            timestamp: Date.now(),
            schemaVersion: HERD_INVENTORY_SCHEMA_VERSION,
        };

        setRecords((prev) => {
            const next = [
                ...prev.filter((entry) => !(entry.nodeId === nodeId && entry.date === effectiveDate)),
                record,
            ];
            void writeLog(next);
            return next;
        });
    }, []);

    const getRecords = useCallback(() => {
        return [...records].sort((left, right) => (Number(left.timestamp) || 0) - (Number(right.timestamp) || 0));
    }, [records]);

    const clearLog = useCallback(() => {
        setRecords([]);
        void writeLog([]);
    }, []);

    return {
        saveTransaction,
        getRecords,
        clearLog,
    };
};
