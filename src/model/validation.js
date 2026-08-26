const VALIDATION_SEVERITY = {
    warning: "warning",
    error: "error",
};

const getLatestRecord = (records, predicate) => {
    return records
        .filter(predicate)
        .sort((a, b) => b.timestamp - a.timestamp)[0] ?? null;
};

const toFiniteNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

const RULES = [
    {
        id: "milked_animals_not_greater_than_total_animals",
        appliesTo: ({ nodeId, answers }) => {
            return nodeId === "view-235" && answers["view-235-number"] !== undefined;
        },
        validate: ({ answers, records, t }) => {
            const milkedAnimals = toFiniteNumber(answers["view-235-number"]);
            if (milkedAnimals === null) {
                return { isValid: true };
            }

            const latestTotalAnimalsRecord = getLatestRecord(
                records,
                (record) => record.scenario === "APP-SETUP" && record.nodeId === "view-220",
            );

            const totalAnimals = toFiniteNumber(latestTotalAnimalsRecord?.answer);
            if (totalAnimals === null) {
                return { isValid: true };
            }

            if (milkedAnimals > totalAnimals) {
                return {
                    isValid: false,
                    message: t("survey.validation.milkedAnimalsExceedTotal"),
                    severity: VALIDATION_SEVERITY.warning,
                };
            }

            return { isValid: true };
        },
    },
    {
        id: "sick_animals_not_greater_than_milked_animals",
        appliesTo: ({ nodeId, answers }) => {
            return nodeId === "view-236" && answers["view-235-number"] !== undefined;
        },
        validate: ({ answers, records, t }) => {
            const sickAnimals = toFiniteNumber(answers["view-235-number"]);
            if (sickAnimals === null) {
                return { isValid: true };
            }

            const latestMilkedAnimalsRecord = getLatestRecord(
                records,
                (record) => record.scenario === "PREORD-07" && record.nodeId === "view-235",
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

export const validateSurveySubmission = ({ nodeId, answers, records, t }) => {
    for (const rule of RULES) {
        if (!rule.appliesTo({ nodeId, answers })) continue;

        const result = rule.validate({ nodeId, answers, records, t });
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
