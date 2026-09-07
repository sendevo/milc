import {
    getEffectiveHerdSizeOnDate,
    isHerdInventoryNode,
    withoutHerdInventoryRecordForNodeAndDate,
} from "../utils/herdInventory";
import { 
    VALIDATION_SEVERITY,
    MILKED_ANIMALS_NODE_IDS,
    SICK_ANIMALS_NODE_IDS,
    COUNT_MUST_NOT_EXCEED_TOTAL_NODE_IDS,
    STOCK_DEDUCTION_NODE_IDS,
} from "../constants";

const getLatestRecord = (records, predicate) => {
    return records
        .filter(predicate)
        .sort((a, b) => b.timestamp - a.timestamp)[0] ?? null;
};

const toFiniteNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

const getEffectiveTotalAnimals = ({ records, inventoryRecords, currentDate }) => {
    if (currentDate) {
        return getEffectiveHerdSizeOnDate(records, inventoryRecords, currentDate);
    }

    const latestTotalAnimalsRecord = getLatestRecord(
        records,
        (record) => record.scenario === "APP-SETUP" && record.nodeId === "view-animal-count",
    );
    return toFiniteNumber(latestTotalAnimalsRecord?.answer);
};

const getFirstSubmittedNumber = (answers = {}) => {
    for (const value of Object.values(answers)) {
        if (value !== undefined) {
            return toFiniteNumber(value);
        }
    }

    return null;
};

const rules = [
    {
        id: "milked_animals_not_greater_than_total_animals",
        appliesTo: ({ nodeId, answers }) => {
            return COUNT_MUST_NOT_EXCEED_TOTAL_NODE_IDS.has(nodeId) && getFirstSubmittedNumber(answers) !== null;
        },
        validate: ({ nodeId, answers, records, inventoryRecords, currentDate, t }) => {
            const milkedAnimals = getFirstSubmittedNumber(answers);
            if (milkedAnimals === null) {
                return { isValid: true };
            }

            let effectiveInventoryRecords = inventoryRecords;
            if (currentDate && COUNT_MUST_NOT_EXCEED_TOTAL_NODE_IDS.has(nodeId) && isHerdInventoryNode(nodeId)) {
                effectiveInventoryRecords = withoutHerdInventoryRecordForNodeAndDate(
                    inventoryRecords,
                    nodeId,
                    currentDate,
                );
            }

            const totalAnimals = getEffectiveTotalAnimals({
                records,
                inventoryRecords: effectiveInventoryRecords,
                currentDate,
            });

            if (totalAnimals === null) {
                return {
                    isValid: false,
                    message: t("survey.validation.herdCountRequired"),
                    severity: VALIDATION_SEVERITY.warning,
                };
            }

            if (milkedAnimals > totalAnimals) {
                return {
                    isValid: false,
                    message: t(
                        MILKED_ANIMALS_NODE_IDS.has(nodeId)
                            ? "survey.validation.milkedAnimalsExceedTotal"
                            : "survey.validation.inventoryAnimalsExceedTotal",
                    ),
                    severity: VALIDATION_SEVERITY.warning,
                };
            }

            return { isValid: true };
        },
    },
    {
        id: "herd_inventory_cannot_go_negative",
        appliesTo: ({ nodeId, answers }) => {
            return STOCK_DEDUCTION_NODE_IDS.has(nodeId) && getFirstSubmittedNumber(answers) !== null;
        },
        validate: ({ nodeId, answers, records, inventoryRecords, currentDate, t }) => {
            const submittedCount = getFirstSubmittedNumber(answers);
            if (submittedCount === null || !currentDate) {
                return { isValid: true };
            }

            const recordsWithoutCurrentNode = withoutHerdInventoryRecordForNodeAndDate(
                inventoryRecords,
                nodeId,
                currentDate,
            );
            const effectiveTotalAnimals = getEffectiveHerdSizeOnDate(records, recordsWithoutCurrentNode, currentDate);

            if (effectiveTotalAnimals === null) {
                return {
                    isValid: false,
                    message: t("survey.validation.herdCountRequired"),
                    severity: VALIDATION_SEVERITY.warning,
                };
            }

            if (submittedCount > effectiveTotalAnimals) {
                return {
                    isValid: false,
                    message: t("survey.validation.herdStockCannotGoNegative"),
                    severity: VALIDATION_SEVERITY.warning,
                };
            }

            return { isValid: true };
        },
    },
    {
        id: "sick_animals_not_greater_than_milked_animals",
        appliesTo: ({ nodeId, answers }) => {
            return SICK_ANIMALS_NODE_IDS.has(nodeId) && getFirstSubmittedNumber(answers) !== null;
        },
        validate: ({ answers, records, t }) => {
            const sickAnimals = getFirstSubmittedNumber(answers);
            if (sickAnimals === null) {
                return { isValid: true };
            }

            const latestMilkedAnimalsRecord = getLatestRecord(
                records,
                (record) => record.scenario === "PREORD-07" && MILKED_ANIMALS_NODE_IDS.has(record.nodeId),
            );

            const milkedAnimals = toFiniteNumber(latestMilkedAnimalsRecord?.answer);
            if (milkedAnimals === null) {
                return { isValid: true };
            }

            if (sickAnimals > milkedAnimals) {
                return {
                    isValid: false,
                    message: t("survey.validation.sickAnimalsExceedMilked"),
                    severity: VALIDATION_SEVERITY.warning,
                };
            }

            return { isValid: true };
        },
    },
];

export const validateSurveySubmission = ({ nodeId, answers, records, inventoryRecords = [], currentDate = "", t }) => {
    for (const rule of rules) {
        if (!rule.appliesTo({ nodeId, answers })) continue;

        const result = rule.validate({ nodeId, answers, records, inventoryRecords, currentDate, t });
        if (!result?.isValid) {
            return {
                isValid: false,
                message: result.message || t("survey.validation.generic"),
                severity: result.severity || VALIDATION_SEVERITY.warning,
                ruleId: rule.id,
            };
        }
    }

    return { isValid: true };
};
