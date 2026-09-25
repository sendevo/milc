import { useMemo } from "react";
import { useSurveyLog } from "./useSurveyLog";
import { useSurveyNodes } from "./useSurveyNodes";
import { computeFullScore } from "../model/scoring";
import { getMilkingMethod } from "../utils/reportData";
import { parseIsoDate, formatAsIsoDate } from "../utils/dateTime";

/**
 * Computes the scoring summary for the records within the given ISO date range,
 * taking into account the user's milking method.
 *
 * @param {string} fromDate - ISO date "YYYY-MM-DD" (optional)
 * @param {string} toDate   - ISO date "YYYY-MM-DD" (optional)
 * @returns {{ score: Object, from: Date|null, to: Date|null, nodes: Object }}
 */
export const useResultScore = (fromDate, toDate) => {
    const { getRecords } = useSurveyLog();
    const nodes = useSurveyNodes();

    const from = useMemo(() => parseIsoDate(fromDate), [fromDate]);
    const to = useMemo(() => parseIsoDate(toDate), [toDate]);

    const score = useMemo(() => {
        const allRecords = getRecords();
        let filteredRecords = allRecords;
        // If a valid date range is provided, filter records within that range
        if (from && to && from <= to) {
            const fromIso = formatAsIsoDate(from);
            const toIso = formatAsIsoDate(to);
            filteredRecords = allRecords.filter((r) => r.date >= fromIso && r.date <= toIso);
        }
        const milkingMethod = getMilkingMethod(allRecords, nodes);
        return computeFullScore(filteredRecords, nodes, milkingMethod);
    }, [getRecords, from, to, nodes]);

    return { score, from, to, nodes };
};
