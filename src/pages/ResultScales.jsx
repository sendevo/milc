import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Divider, IconButton, Typography } from "@mui/material";
import ViewContainer from "../components/ViewContainer";
import { resultScalesStyles as styles } from "../theme/ResultScales.styles";
import { useModal } from "../contexts/ModalContext";
import { useSurveyLog } from "../hooks/useSurveyLog";
import { useSurveyNodes } from "../hooks/useSurveyNodes";
import { computeFullScore } from "../model/scoring";
import { buildScoredAspects } from "../model/aspects";
import { parseIsoDate, formatAsIsoDate } from "../utils/dateTime";
import checkTrue from "../assets/icons/check_true.png";
import checkFalse from "../assets/icons/check_false.png";

const ResultScales = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { openModal } = useModal();
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

    const periodLabel = useMemo(() => {
        if (from && to && from <= to) {
            return `${formatAsIsoDate(from)} - ${formatAsIsoDate(to)}`;
        }
        if (from && !to) return formatAsIsoDate(from);
        if (!from && to) return formatAsIsoDate(to);
        return "-";
    }, [from, to]);

    const score = useMemo(() => {
        return computeFullScore(filteredRecords, nodes);
    }, [filteredRecords, nodes]);

    const aspects = useMemo(() => {
        return buildScoredAspects(score, t);
    }, [score.byCategory, score.byScenario, t]);

    const handleAspectClick = (rating, targetView) => {
        if (rating === 0) {
            openModal({
                title: t("resultScales.title"),
                content: (
                    <Typography>
                        {t("resultScales.notEvaluated")}
                    </Typography>
                ),
                actions: [
                    {
                        label: t("survey.finish"),
                        variant: "contained",
                    },
                ],
            });
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
                <Typography sx={{ alignSelf: "flex-start", mb: 1 }}>
                    {`${t("resultScales.period")}: ${periodLabel}`}
                </Typography>
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
                        onClick={() => navigate("/log-menu?fromDate=" + fromDate + "&toDate=" + toDate)}>
                        {t("resultScales.back")}
                    </Button>
                </Box>
            </Box>
        </ViewContainer>
    );
};

export default ResultScales;
