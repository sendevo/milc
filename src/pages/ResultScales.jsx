import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Divider, IconButton, Typography } from "@mui/material";
import ViewContainer from "../components/ViewContainer";
import { resultScalesStyles as styles } from "../theme/ResultScales.styles";
import { useToast } from "../contexts/ToastContext";
import { useSurveyLog } from "../hooks/useSurveyLog";
import { useSurveyNodes } from "../hooks/useSurveyNodes";
import { computeFullScore } from "../model/scoring";
import { parseIsoDate, formatAsIsoDate } from "../utils/dateTime";
import blueGoat from "../assets/icons/blue_goat.png";
import udder from "../assets/icons/udder.png";
import milkPail from "../assets/icons/milk_pail.png";
import goatHealth from "../assets/icons/goat_health.png";
import weed from "../assets/icons/weed.png";
import cattlePen from "../assets/icons/cattle_pen.png";
import barn from "../assets/icons/barn.png";
import pest from "../assets/icons/pest.png";
import checkTrue from "../assets/icons/check_true.png";
import checkFalse from "../assets/icons/check_false.png";

const CHECKS_BY_RATING = {
    excellent: 4,
    "very-good": 3,
    regular: 2,
    "needs-improvement": 1,
};

const normalizeCategoryKey = (value) => (value || "").toLowerCase().replace(/[-_\s]/g, "");

const ResultScales = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const { getRecords } = useSurveyLog();
    const nodes = useSurveyNodes();

    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const from = useMemo(() => parseIsoDate(fromDate), [fromDate]);
    const to = useMemo(() => parseIsoDate(toDate), [toDate]);

    const filteredRecords = useMemo(() => {
        const allRecords = getRecords();
        // If a valid date range is provided, filter records within that range
        if (from && to && from <= to) {
            const fromIso = formatAsIsoDate(from);
            const toIso = formatAsIsoDate(to);
            return allRecords.filter((r) => r.date >= fromIso && r.date <= toIso);
        }
        return allRecords;
    }, [getRecords, from, to]);

    const score = useMemo(() => {
        return computeFullScore(filteredRecords, nodes);
    }, [filteredRecords, nodes]);

    const aspects = useMemo(() => { // This is the main logic for mapping scores to the aspects shown on this page
        const base = [
            {
                icon: blueGoat,
                label: t("mainMenu.beforeMilking"),
                categoryKeys: ["before-milking", "before_milking", "beforeMilking"],
                fallbackRating: 0,
            },
            {
                icon: udder,
                label: t("mainMenu.duringMilking"),
                categoryKeys: ["during-milking", "during_milking", "duringMilking"],
                fallbackRating: 0,
            },
            {
                icon: milkPail,
                label: t("mainMenu.milkCare"),
                categoryKeys: ["milk-care", "milk_care", "milkCare"],
                fallbackRating: 0,
            },
            {
                icon: goatHealth,
                label: t("mainMenu.health"),
                categoryKeys: ["health"],
                fallbackRating: 0,
            },
            {
                icon: weed,
                label: t("mainMenu.food"),
                categoryKeys: ["food", "feed"],
                fallbackRating: 0,
            },
            {
                icon: cattlePen,
                label: t("mainMenu.facilities"),
                categoryKeys: ["facilities"],
                fallbackRating: 0,
            },
            {
                icon: barn,
                label: t("mainMenu.mySupplies"),
                categoryKeys: ["supplies", "my-supplies", "my_supplies", "insumos"],
                fallbackRating: 0,
            },
            {
                icon: pest,
                label: t("mainMenu.pests"),
                categoryKeys: ["pests"],
                fallbackRating: 0,
            },
        ];

        return base.map((aspect) => {
            const categoryKeySet = new Set(aspect.categoryKeys.map(normalizeCategoryKey));
            const matchedCategory = aspect.categoryKeys.find((key) => score.byCategory[key]);
            const categoryData = matchedCategory ? score.byCategory[matchedCategory] : null;
            const hasEvaluatedData = Object.values(score.byScenario).some((scenarioScore) => {
                const scenarioCategory = normalizeCategoryKey(scenarioScore.category);
                return categoryKeySet.has(scenarioCategory) && scenarioScore.expected > 0;
            });

            const rating = hasEvaluatedData && categoryData
                ? (CHECKS_BY_RATING[categoryData.rating] ?? 1)
                : aspect.fallbackRating;
            const targetView = hasEvaluatedData && categoryData
                ? categoryData.resultViewId
                : null;

            return {
                icon: aspect.icon,
                label: aspect.label,
                rating,
                targetView,
            };
        });
    }, [score.byCategory, score.byScenario, t]);

    const handleAspectClick = (rating, targetView) => {
        if (rating === 0) {
            showToast(t("resultScales.notEvaluated"));
            return;
        }
        if (!targetView) return;
        navigate(`/survey/${targetView}`);
    };
    return (
        <ViewContainer
            title={t("resultScales.title")}
            onBack={() => navigate(`/milkbarchart${searchParams.toString() ? `?${searchParams.toString()}` : ""}`)}  
            showDate>
            <Box sx={styles.page}>
                <Box sx={styles.rowsContainer}>
                    {aspects.map((aspect, index) => (
                        <Box key={`${index}-${aspect.rating}`}>
                            <Box sx={styles.row}>
                                <Box sx={styles.aspectColumn}>
                                    <IconButton
                                        onClick={() => handleAspectClick(aspect.rating, aspect.targetView)}
                                        sx={styles.aspectButton(true)}>
                                        <img src={aspect.icon} alt={aspect.label} style={styles.aspectIcon} />
                                    </IconButton>
                                    <Typography sx={styles.aspectLabel}>{aspect.label}</Typography>
                                </Box>

                                <Box sx={styles.ratingContainer}>
                                    {Array.from({ length: 4 }, (_, i) => (
                                        <img
                                            key={`${index}-check-${i}`}
                                            src={i < aspect.rating ? checkTrue : checkFalse}
                                            alt={i < aspect.rating ? "checked" : "unchecked"}
                                            style={styles.ratingIcon}
                                        />
                                    ))}
                                </Box>
                            </Box>
                            {index < aspects.length - 1 && <Divider sx={styles.rowDivider} />}
                        </Box>
                    ))}
                </Box>

                <Box sx={styles.bottomActions}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate("/app")}>
                        {t("survey.finish")}
                    </Button>
                </Box>
            </Box>
        </ViewContainer>
    );
};

export default ResultScales;
