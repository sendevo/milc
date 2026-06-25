import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import BarChart from "../components/BarChart";
import ViewContainer from "../components/ViewContainer";
import { useSurveyLog } from "../hooks/useSurveyLog";
import { milkBarChartStyles as styles } from "../theme/MilkBarChart.styles";
import { parseIsoDate, formatAsIsoDate, getDaysBetweenInclusive, getMonthSpanInclusive } from "../utils/dateTime";


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

const buildEffectiveAnimalsByDate = (records, startDate, endDate) => {
    if (!startDate || !endDate || startDate > endDate) return {};

    const fromIso = formatAsIsoDate(startDate);
    const toIso = formatAsIsoDate(endDate);
    const latestByDate = {};
    let latestBeforeStart = null;

    for (const record of records) {
        if (record.nodeId !== "view-220") continue;
        if (!record.date || record.date > toIso) continue;

        const value = Number(record.answer);
        if (!Number.isFinite(value) || value <= 0) continue;

        const timestamp = Number(record.timestamp) || 0;
        if (record.date < fromIso) {
            if (
                !latestBeforeStart ||
                record.date > latestBeforeStart.date ||
                (record.date === latestBeforeStart.date && timestamp >= latestBeforeStart.timestamp)
            ) {
                latestBeforeStart = { date: record.date, value, timestamp };
            }
            continue;
        }

        const previous = latestByDate[record.date];
        if (!previous || timestamp >= previous.timestamp) {
            latestByDate[record.date] = { value, timestamp };
        }
    }

    const valuesByDate = {};
    let latestKnownAnimals = latestBeforeStart?.value ?? null;
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const finalDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    while (cursor <= finalDate) {
        const isoDate = formatAsIsoDate(cursor);
        const entry = latestByDate[isoDate];

        if (entry) {
            latestKnownAnimals = entry.value;
        }

        if (Number.isFinite(latestKnownAnimals) && latestKnownAnimals > 0) {
            valuesByDate[isoDate] = latestKnownAnimals;
        }

        cursor.setDate(cursor.getDate() + 1);
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
    const animalsByDate = useMemo(
        () => buildEffectiveAnimalsByDate(records, from, to),
        [records, from, to],
    );
    const series = useMemo(
        () => buildSeries(from, to, i18n.language, milkValuesByDate),
        [from, to, i18n.language, milkValuesByDate],
    );
    const chartCategories = useMemo(() => series.map((item) => item.label), [series]);
    const chartSeries = useMemo(() => [{
        label: t("milkBarChart.liters"),
        data: series.map((item) => item.value),
    }], [series, t]);
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
    const litersPerAnimal = useMemo(() => {
        if (!from || !to || from > to) return 0;

        const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
        const finalDate = new Date(to.getFullYear(), to.getMonth(), to.getDate());
        let totalDailyLitersPerAnimal = 0;
        let daysWithAnimals = 0;

        while (cursor <= finalDate) {
            const isoDate = formatAsIsoDate(cursor);
            const milkValue = Number(milkValuesByDate[isoDate] ?? 0);
            const animalsCount = Number(animalsByDate[isoDate]);

            if (Number.isFinite(animalsCount) && animalsCount > 0) {
                totalDailyLitersPerAnimal += milkValue / animalsCount;
                daysWithAnimals += 1;
            }

            cursor.setDate(cursor.getDate() + 1);
        }

        if (!daysWithAnimals) return 0;
        return Number((totalDailyLitersPerAnimal / daysWithAnimals).toFixed(2));
    }, [from, to, milkValuesByDate, animalsByDate]);

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

                <BarChart
                    categories={chartCategories}
                    series={chartSeries}
                    yAxisLabel={t("milkBarChart.liters")}
                    xAxisLabel={isMonthlyGrouped ? t("milkBarChart.months") : t("milkBarChart.days")}
                    showGrid={false}
                />

                <Box sx={styles.bottomActions}>
                    <Button variant="outlined" fullWidth onClick={() => navigate("/calendar")}>
                        {t("milkBarChart.back")}
                    </Button>
                    <Button variant="contained" fullWidth onClick={() => navigate(`/resultscales?${searchParams.toString()}`)}>
                        {t("milkBarChart.next")}
                    </Button>
                </Box>
            </Box>
        </ViewContainer>
    );
};

export default MilkBarChart;
