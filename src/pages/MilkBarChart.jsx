import { useEffect, useMemo } from "react";
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

const getDeterministicValue = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return Number((3 + ((day * 17 + (month + 1) * 7 + year) % 36) / 4).toFixed(1));
};

const getDaysBetweenInclusive = (startDate, endDate) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return Math.floor((end - start) / msPerDay) + 1;
};

const buildSeries = (startDate, endDate, language) => {
    if (!startDate || !endDate || startDate > endDate) return [];

    const days = [];
    const totalDays = getDaysBetweenInclusive(startDate, endDate);
    const shouldGroupByMonth = totalDays > 31;
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const finalDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const monthFormatter = new Intl.DateTimeFormat(language || "es", {
        month: "short",
        year: "2-digit",
    });

    while (cursor <= finalDate) {
        const year = cursor.getFullYear();
        const month = cursor.getMonth();
        const day = cursor.getDate();
        const value = getDeterministicValue(cursor);

        if (!shouldGroupByMonth) {
            days.push({
                key: `${year}-${month + 1}-${day}`,
                label: String(day).padStart(2, "0"),
                value,
            });
        } else {
            const monthKey = `${year}-${month + 1}`;
            const existing = days[days.length - 1];
            if (existing && existing.key === monthKey) {
                existing.value = Number((existing.value + value).toFixed(1));
            } else {
                days.push({
                    key: monthKey,
                    label: monthFormatter.format(cursor),
                    value,
                });
            }
        }

        cursor.setDate(cursor.getDate() + 1);
    }

    return days;
};

const MilkBarChart = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";

    const from = useMemo(() => parseIsoDate(fromDate), [fromDate]);
    const to = useMemo(() => parseIsoDate(toDate), [toDate]);
    const isRangeValid = Boolean(from && to && from <= to);
    const isMonthlyGrouped = useMemo(
        () => Boolean(from && to && getDaysBetweenInclusive(from, to) > 31),
        [from, to],
    );
    const series = useMemo(() => buildSeries(from, to, i18n.language), [from, to, i18n.language]);
    const maxValue = useMemo(() => Math.max(...series.map((item) => item.value), 0), [series]);

    useEffect(() => {
        if (isRangeValid) return;
        navigate("/calendar", { replace: true });
    }, [isRangeValid, navigate]);

    if (!isRangeValid) return null;

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

                <Box sx={styles.chartCard}>
                    <Typography sx={styles.chartTopUnit}>{t("milkBarChart.liters")}</Typography>
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
                    <Typography sx={styles.chartBottomUnit}>
                        {isMonthlyGrouped ? t("milkBarChart.months") : t("milkBarChart.days")}
                    </Typography>
                </Box>

                <Box sx={styles.bottomActions}>
                    <Button variant="outlined" fullWidth onClick={() => navigate("/calendar")}>
                        {t("milkBarChart.back")}
                    </Button>
                    <Button variant="contained" fullWidth onClick={() => navigate("/resultscales")}>
                        {t("milkBarChart.next")}
                    </Button>
                </Box>
            </Box>
        </ViewContainer>
    );
};

export default MilkBarChart;
