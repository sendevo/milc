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

const getRatingCircleSx = (rating, index) => {
    const isFilled = index < rating;

    if (rating === 4) {
        return styles.ratingCircle({
            borderColor: "#2e7d32",
            backgroundColor: "#2e7d32",
        });
    }

    if (rating === 3) {
        return styles.ratingCircle(
            isFilled
                ? {
                    borderColor: "#c62828",
                    backgroundColor: "#c62828",
                }
                : {
                    borderColor: "#c62828",
                    backgroundColor: "#ffffff",
                }
        );
    }

    if (rating === 2) {
        return styles.ratingCircle(
            isFilled
                ? {
                    borderColor: "#c62828",
                    backgroundImage: "repeating-linear-gradient(90deg, #c62828 0 6px, #111111 6px 12px)",
                }
                : {
                    borderColor: "#c62828",
                    backgroundColor: "#ffffff",
                }
        );
    }

    if (rating === 1) {
        return styles.ratingCircle(
            isFilled
                ? {
                    borderColor: "#111111",
                    backgroundColor: "#111111",
                }
                : {
                    borderColor: "#111111",
                    backgroundColor: "#ffffff",
                }
        );
    }

    return styles.ratingCircle({
        borderColor: "#9e9e9e",
        backgroundColor: "#ffffff",
    });
};

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
                        label: t("resultScales.ok"),
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
            onBack={() => navigate("/calendar")}  
            showDate>
            <Box sx={styles.page}>
                <Typography sx={{ alignSelf: "flex-start", mb: 1 }}>
                    {`${t("resultScales.period")}: ${periodLabel}`}
                </Typography>
                <Box sx={styles.rowsContainer}>
                    {aspects.map((aspect, index) => {
                        const isNotComputed = aspect.rating === 0;
                        const mutedIconStyle = isNotComputed
                            ? { filter: "grayscale(1)", opacity: 0.65 }
                            : undefined;

                        return (
                        <Box key={`${index}-${aspect.rating}`}>
                            <Box sx={styles.row}>
                                <Box sx={styles.aspectColumn}>
                                    <IconButton
                                        onClick={() => handleAspectClick(aspect.rating, aspect.targetView)}
                                        sx={styles.aspectButton(true, isNotComputed)}>
                                        <img
                                            src={aspect.icon}
                                            alt={aspect.label}
                                            style={{ ...styles.aspectIcon, ...mutedIconStyle }}
                                        />
                                    </IconButton>
                                    <Typography sx={styles.aspectLabel}>{aspect.label}</Typography>
                                </Box>

                                <Box sx={styles.ratingContainer}>
                                    {Array.from({ length: 4 }, (_, i) => (
                                        <Box
                                            key={`${index}-check-${i}`}
                                            aria-hidden="true"
                                            sx={{
                                                ...getRatingCircleSx(aspect.rating, i),
                                                ...(isNotComputed ? styles.ratingCircleMuted : {}),
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                            {index < aspects.length - 1 && <Divider sx={styles.rowDivider} />}
                        </Box>
                        );
                    })}
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
