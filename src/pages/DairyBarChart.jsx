import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import BarChart from "../components/BarChart";
import ViewContainer from "../components/ViewContainer";
import { useSurveyLog } from "../hooks/useSurveyLog";
import { dairyBarChartStyles as styles } from "../theme/DairyBarChart.styles";
import { parseIsoDate, formatAsIsoDate, getDaysBetweenInclusive } from "../utils/dateTime";

const TOTAL_ANIMALS_NODE_IDS = ["view-220"];
const MILKED_ANIMALS_NODE_IDS = ["view-235", "view-36"];

const buildEffectiveValuesByDate = (records, nodeIds, startDate, endDate) => {
    if (!startDate || !endDate || startDate > endDate) return {};

    const fromIso = formatAsIsoDate(startDate);
    const toIso = formatAsIsoDate(endDate);
    const trackedIds = new Set(nodeIds);
    const latestByDate = {};
    let latestBeforeStart = null;

    for (const record of records) {
        if (!trackedIds.has(record.nodeId)) continue;
        if (!record.date || record.date > toIso) continue;

        const value = Number(record.answer);
        if (!Number.isFinite(value) || value < 0) continue;

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
    let latestKnownValue = latestBeforeStart?.value ?? 0;
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const finalDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    while (cursor <= finalDate) {
        const isoDate = formatAsIsoDate(cursor);
        const entry = latestByDate[isoDate];

        if (entry) {
            latestKnownValue = entry.value;
        }

        valuesByDate[isoDate] = latestKnownValue;
        cursor.setDate(cursor.getDate() + 1);
    }

    return valuesByDate;
};

const buildChartBuckets = (startDate, endDate, language, totalByDate, milkedByDate) => {
    if (!startDate || !endDate || startDate > endDate) return [];

    const shouldGroupByMonth = getDaysBetweenInclusive(startDate, endDate) > 31;
    const monthFormatter = new Intl.DateTimeFormat(language || "es", {
        month: "short",
        year: "2-digit",
    });
    const buckets = [];
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const finalDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    while (cursor <= finalDate) {
        const year = cursor.getFullYear();
        const month = cursor.getMonth();
        const day = cursor.getDate();
        const isoDate = formatAsIsoDate(cursor);
        const total = Number(totalByDate[isoDate] ?? 0);
        const milked = Number(milkedByDate[isoDate] ?? 0);

        if (!shouldGroupByMonth) {
            buckets.push({
                key: `${year}-${month + 1}-${day}`,
                label: String(day).padStart(2, "0"),
                total,
                milked,
            });
        } else {
            const monthKey = `${year}-${month + 1}`;
            const existing = buckets[buckets.length - 1];
            if (existing && existing.key === monthKey) {
                existing.totalSum += total;
                existing.milkedSum += milked;
                existing.days += 1;
                existing.total = Number((existing.totalSum / existing.days).toFixed(1));
                existing.milked = Number((existing.milkedSum / existing.days).toFixed(1));
            } else {
                buckets.push({
                    key: monthKey,
                    label: monthFormatter.format(cursor),
                    total,
                    milked,
                    totalSum: total,
                    milkedSum: milked,
                    days: 1,
                });
            }
        }

        cursor.setDate(cursor.getDate() + 1);
    }

    return buckets.map(({ totalSum, milkedSum, days, ...bucket }) => bucket);
};

const averageByDate = (valuesByDate) => {
    const values = Object.values(valuesByDate).map(Number);
    if (!values.length) return 0;
    const sum = values.reduce((acc, value) => acc + value, 0);
    return Number((sum / values.length).toFixed(1));
};

const DairyBarChart = () => {
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
    const isMonthlyGrouped = useMemo(
        () => Boolean(from && to && getDaysBetweenInclusive(from, to) > 31),
        [from, to],
    );

    const totalAnimalsByDate = useMemo(
        () => buildEffectiveValuesByDate(records, TOTAL_ANIMALS_NODE_IDS, from, to),
        [records, from, to],
    );
    const milkedAnimalsByDate = useMemo(
        () => buildEffectiveValuesByDate(records, MILKED_ANIMALS_NODE_IDS, from, to),
        [records, from, to],
    );

    const buckets = useMemo(
        () => buildChartBuckets(from, to, i18n.language, totalAnimalsByDate, milkedAnimalsByDate),
        [from, to, i18n.language, totalAnimalsByDate, milkedAnimalsByDate],
    );

    const averageTotalAnimals = useMemo(
        () => averageByDate(totalAnimalsByDate),
        [totalAnimalsByDate],
    );
    const averageMilkedAnimals = useMemo(
        () => averageByDate(milkedAnimalsByDate),
        [milkedAnimalsByDate],
    );

    const chartCategories = useMemo(
        () => buckets.map((item) => item.label),
        [buckets],
    );
    const chartSeries = useMemo(() => [
        {
            label: t("dairyBarChart.totalAnimals"),
            data: buckets.map((item) => item.total),
            color: { from: "#2dc5a2", to: "#1a8090" },
        },
        {
            label: t("dairyBarChart.milkedAnimals"),
            data: buckets.map((item) => item.milked),
            color: { from: "#74b3ff", to: "#2f6ad9" },
        },
    ], [buckets, t]);

    useEffect(() => {
        if (isRangeValid) return;
        navigate("/calendar", { replace: true });
    }, [isRangeValid, navigate]);

    if (!isRangeValid) return null;

    return (
        <ViewContainer
            title={t("dairyBarChart.title")}
            subtitle={t("dairyBarChart.subtitle")}
            onBack={() => navigate(`/log-menu?${searchParams.toString()}`)}
            showDate>
            <Box sx={styles.page}>
                <Typography sx={styles.rangeText}>
                    {t("dairyBarChart.period")}: {fromDate} - {toDate}
                </Typography>

                <Box sx={styles.averagesCard}>
                    <Box sx={styles.averageItem}>
                        <Typography sx={styles.averageLabel}>{t("dairyBarChart.averageTotal")}</Typography>
                        <Typography sx={styles.averageValue}>{averageTotalAnimals}</Typography>
                    </Box>
                    <Box sx={styles.averageItem}>
                        <Typography sx={styles.averageLabel}>{t("dairyBarChart.averageMilked")}</Typography>
                        <Typography sx={styles.averageValue}>{averageMilkedAnimals}</Typography>
                    </Box>
                </Box>

                <BarChart
                    categories={chartCategories}
                    series={chartSeries}
                    yAxisLabel={t("dairyBarChart.count")}
                    xAxisLabel={isMonthlyGrouped ? t("dairyBarChart.months") : t("dairyBarChart.days")}
                    showGrid={false}
                />

                <Box sx={styles.bottomActions}>
                    <Button variant="outlined" fullWidth onClick={() => navigate(`/log-menu?${searchParams.toString()}`)}>
                        {t("dairyBarChart.back")}
                    </Button>
                    <Button variant="contained" fullWidth onClick={() => navigate(`/milkbarchart?${searchParams.toString()}`)}>
                        {t("dairyBarChart.next")}
                    </Button>
                </Box>
            </Box>
        </ViewContainer>
    );
};

export default DairyBarChart;