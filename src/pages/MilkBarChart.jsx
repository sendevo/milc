import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import ViewContainer from "../components/ViewContainer";
import { useSurveyLog } from "../hooks/useSurveyLog";
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

const getDaysBetweenInclusive = (startDate, endDate) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return Math.floor((end - start) / msPerDay) + 1;
};

const formatAsIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getMonthSpanInclusive = (startDate, endDate) => {
    const fromYear = startDate.getFullYear();
    const fromMonth = startDate.getMonth();
    const toYear = endDate.getFullYear();
    const toMonth = endDate.getMonth();
    return (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
};

const buildLatestMilkByDate = (records, startDate, endDate) => {
    if (!startDate || !endDate || startDate > endDate) return {};

    const fromIso = formatAsIsoDate(startDate);
    const toIso = formatAsIsoDate(endDate);
    const latestByDate = {};

    for (const record of records) {
        if (record.nodeId !== "view-55") continue;
        if (!record.date || record.date < fromIso || record.date > toIso) continue;

        const value = Number(record.answer);
        if (!Number.isFinite(value)) continue;

        const timestamp = Number(record.timestamp) || 0;
        const previous = latestByDate[record.date];
        if (!previous || timestamp >= previous.timestamp) {
            latestByDate[record.date] = { value, timestamp };
        }
    }

    const valuesByDate = {};
    for (const [date, entry] of Object.entries(latestByDate)) {
        valuesByDate[date] = entry.value;
    }

    return valuesByDate;
};

const buildSeries = (startDate, endDate, language, valuesByDate) => {
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
        const isoDate = formatAsIsoDate(cursor);
        const value = Number(valuesByDate[isoDate] ?? 0);

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
    const { getRecords } = useSurveyLog();

    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";

    const from = useMemo(() => parseIsoDate(fromDate), [fromDate]);
    const to = useMemo(() => parseIsoDate(toDate), [toDate]);
    const records = useMemo(() => getRecords(), [getRecords]);
    const isRangeValid = Boolean(from && to && from <= to);
    const totalDaysInRange = useMemo(
        () => (from && to && from <= to ? getDaysBetweenInclusive(from, to) : 0),
        [from, to],
    );
    const monthsInRange = useMemo(
        () => (from && to && from <= to ? getMonthSpanInclusive(from, to) : 0),
        [from, to],
    );
    const isMonthlyGrouped = useMemo(
        () => Boolean(from && to && getDaysBetweenInclusive(from, to) > 31),
        [from, to],
    );
    const milkValuesByDate = useMemo(
        () => buildLatestMilkByDate(records, from, to),
        [records, from, to],
    );
    const series = useMemo(
        () => buildSeries(from, to, i18n.language, milkValuesByDate),
        [from, to, i18n.language, milkValuesByDate],
    );
    const maxValue = useMemo(() => Math.max(...series.map((item) => item.value), 0), [series]);
    const totalLiters = useMemo(
        () => Number(series.reduce((sum, item) => sum + item.value, 0).toFixed(1)),
        [series],
    );
    const averageLitersPerMonth = useMemo(() => {
        if (!monthsInRange) return 0;
        return Number((totalLiters / monthsInRange).toFixed(1));
    }, [totalLiters, monthsInRange]);
    const averageLitersPerDay = useMemo(() => {
        if (!totalDaysInRange) return 0;
        return Number((totalLiters / totalDaysInRange).toFixed(1));
    }, [totalLiters, totalDaysInRange]);
    const latestAnimalsRecord = useMemo(() => {
        const animalRecords = records.filter((record) => record.nodeId === "view-220");
        if (!animalRecords.length) return null;
        return animalRecords.reduce((latest, current) => {
            return (Number(current.timestamp) || 0) > (Number(latest.timestamp) || 0)
                ? current
                : latest;
        });
    }, [records]);
    const animalsCount = Number(latestAnimalsRecord?.answer);
    const litersPerAnimal = useMemo(() => {
        if (!Number.isFinite(animalsCount) || animalsCount <= 0) return 0;
        return Number((averageLitersPerDay / animalsCount).toFixed(2));
    }, [averageLitersPerDay, animalsCount]);

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
                ${t("milkBarChart.average")} ${averageLitersPerMonth} ${t("milkBarChart.litersMonth")}
                <br />
                ${t("milkBarChart.litersAnimal")} ${litersPerAnimal}
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
                            const barHeight = ratio <= 0 ? "0%" : `${Math.max(8, ratio * 100)}%`;
                            return (
                                <Box key={item.key} sx={styles.barItem}>
                                    <Typography sx={styles.barValue}>{item.value}</Typography>
                                    <Box sx={styles.barTrack}>
                                        <Box
                                            sx={{
                                                ...styles.barFill,
                                                height: barHeight,
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
