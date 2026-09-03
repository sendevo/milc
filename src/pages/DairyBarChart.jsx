import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import BarChart from "../components/BarChart";
import ViewContainer from "../components/ViewContainer";
import { useSurveyLog } from "../hooks/useSurveyLog";
import { useHerdInventory } from "../hooks/useHerdInventory";
import { dairyBarChartStyles as styles } from "../theme/DairyBarChart.styles";
import { parseIsoDate, getDaysBetweenInclusive } from "../utils/dateTime";
import {
    buildEffectiveAnimalsByDate,
    buildEffectiveValuesByDate,
    buildChartBuckets,
    averageByDate,
} from "../utils/reportData";
import { MILKED_ANIMALS_NODE_IDS } from "../constants/constants";

const DairyBarChart = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { getRecords } = useSurveyLog();
    const { getRecords: getInventoryRecords } = useHerdInventory();

    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";

    const from = useMemo(() => parseIsoDate(fromDate), [fromDate]);
    const to = useMemo(() => parseIsoDate(toDate), [toDate]);
    const records = useMemo(() => getRecords(), [getRecords]);
    const inventoryRecords = useMemo(() => getInventoryRecords(), [getInventoryRecords]);
    const isRangeValid = Boolean(from && to && from <= to);
    const isMonthlyGrouped = useMemo(
        () => Boolean(from && to && getDaysBetweenInclusive(from, to) > 31),
        [from, to],
    );

    const totalAnimalsByDate = useMemo(
        () => buildEffectiveAnimalsByDate(records, inventoryRecords, from, to),
        [records, inventoryRecords, from, to],
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
                    minCategoryWidth={84}
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