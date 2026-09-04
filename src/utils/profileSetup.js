import { MONTH_KEYS, PROFILE_SETUP_CONFLICTING_NODE_IDS } from "../constants";

export function isYesMilkAllYearAnswer(answer) {
    if (answer === undefined || answer === null || answer === "") {
        return false;
    }

    if (Array.isArray(answer)) {
        return false;
    }

    if (typeof answer === "string") {
        const normalized = answer.trim().toLowerCase();
        return normalized === "yes";
    }

    return false;
}

export function isNoMilkAllYearAnswer(answer) {
    if (answer === undefined || answer === null || answer === "") {
        return false;
    }

    if (Array.isArray(answer)) {
        return false;
    }

    if (typeof answer === "string") {
        const normalized = answer.trim().toLowerCase();
        return normalized === "no";
    }

    return false;
}

export function cleanConflictingProfileSetupRecords(records, nodeId, scenario, date) {
    if (!Array.isArray(records) || !nodeId || !scenario || !date) {
        return records;
    }

    const conflictingNodeIds = PROFILE_SETUP_CONFLICTING_NODE_IDS[nodeId];
    if (!conflictingNodeIds || conflictingNodeIds.size === 0) {
        return records;
    }

    return records.filter((record) => {
        if (record.scenario !== scenario || record.date !== date) {
            return true;
        }

        const isCurrentNode = record.nodeId === nodeId;
        const isConflictingNode = conflictingNodeIds.has(record.nodeId);

        return !(isConflictingNode && !isCurrentNode);
    });
}

export function formatMonthList(monthNumbers, t) {
    if (!Array.isArray(monthNumbers) || monthNumbers.length === 0) {
        return "";
    }

    const uniqueSortedMonths = [...new Set(monthNumbers)]
        .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12)
        .sort((a, b) => a - b);

    if (uniqueSortedMonths.length === 0) {
        return "";
    }

    return uniqueSortedMonths
        .map((month) => t(`survey.months.${MONTH_KEYS[month - 1]}`))
        .join(", ");
}
