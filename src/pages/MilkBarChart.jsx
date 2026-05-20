import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import ViewContainer from "../components/ViewContainer";
import { milkBarChartStyles as styles } from "../theme/MilkBarChart.styles";

const parseIsoDate = (value) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }
    return date;
};

const buildSeries = (startDate, endDate) => {
    if (!startDate || !endDate || startDate > endDate) return [];

    const days = [];
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const finalDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    while (cursor <= finalDate) {
        const year = cursor.getFullYear();
        const month = cursor.getMonth();
        const day = cursor.getDate();
        const label = String(day).padStart(2, "0");
        // Deterministic placeholder values until production records are persisted.
        const value = Number((3 + ((day * 17 + (month + 1) * 7 + year) % 36) / 4).toFixed(1));

        days.push({
            key: `${year}-${month + 1}-${day}`,
            label,
            value,
        });

        cursor.setDate(cursor.getDate() + 1);
    }

    return days;
};

const MilkBarChart = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";

    const from = useMemo(() => parseIsoDate(fromDate), [fromDate]);
    const to = useMemo(() => parseIsoDate(toDate), [toDate]);
    const isRangeValid = Boolean(from && to && from <= to);
    const series = useMemo(() => buildSeries(from, to), [from, to]);
    const maxValue = useMemo(() => Math.max(...series.map((item) => item.value), 0), [series]);

    return (
        <ViewContainer
            title={t("milkBarChart.title")}
            subtitle={`
                ${t("milkBarChart.subtitle")}
                <br />
                ${t("milkBarChart.average")} ${43} ${t("milkBarChart.litersMonth")}
                <br />
                ${t("milkBarChart.litersAnimal")} ${2}
            `}
            onBack={() => navigate("/calendar")}
            showDate>
            <Box sx={styles.page}>
                <Typography sx={styles.rangeText}>
                    {t("milkBarChart.period")}: {fromDate} - {toDate}
                </Typography>

                {!isRangeValid && (
                    <Typography sx={styles.errorText}>
                        {t("milkBarChart.invalidRange")}
                    </Typography>
                )}

                {isRangeValid && (
                    <Box sx={styles.chartCard}>
                        <Box sx={styles.chartArea}>
                            {series.map((item) => {
                                const ratio = maxValue > 0 ? item.value / maxValue : 0;
                                return (
                                    <Box key={item.key} sx={styles.barItem}>
                                        <Typography sx={styles.barValue}>{item.value}</Typography>
                                        <Box sx={styles.barTrack}>
                                            <Box
                                                sx={{
                                                    ...styles.barFill,
                                                    height: `${Math.max(8, ratio * 100)}%`,
                                                }}
                                            />
                                        </Box>
                                        <Typography sx={styles.barLabel}>{item.label}</Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                )}

                <Box sx={styles.bottomActions}>
                    <Button variant="outlined" fullWidth onClick={() => navigate("/calendar")}>
                        {t("milkBarChart.back")}
                    </Button>
                </Box>
            </Box>
        </ViewContainer>
    );
};

export default MilkBarChart;
