import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import BarChart from "../components/BarChart";
import ViewContainer from "../components/ViewContainer";
import { useSurveyLog } from "../hooks/useSurveyLog";
import { milkBarChartStyles as styles } from "../theme/MilkBarChart.styles";
import { parseIsoDate, formatAsIsoDate, getDaysBetweenInclusive } from "../utils/dateTime";
import {
    buildLatestMilkByDate,
    buildMilkedAnimalsByDate,
    buildSeries,
    computeLitersPerAnimal,
    countMilkingDays,
} from "../utils/reportData";

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
    const isMonthlyGrouped = useMemo(
        () => Boolean(from && to && getDaysBetweenInclusive(from, to) > 31),
        [from, to],
    );
    const milkValuesByDate = useMemo(
        () => buildLatestMilkByDate(records, from, to),
        [records, from, to],
    );
    const milkedAnimalsByDate = useMemo(
        () => buildMilkedAnimalsByDate(records, from, to),
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
    // Average over the days with milking, not over every day of the period
    const milkingDays = useMemo(() => countMilkingDays(milkValuesByDate), [milkValuesByDate]);
    const averageLitersPerDay = useMemo(() => {
        if (!milkingDays) return 0;
        return Number((totalLiters / milkingDays).toFixed(1));
    }, [totalLiters, milkingDays]);
    const litersPerAnimal = useMemo(() => {
        return computeLitersPerAnimal(from, to, milkValuesByDate, milkedAnimalsByDate);
    }, [from, to, milkValuesByDate, milkedAnimalsByDate]);

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
                ${t("milkBarChart.milkingDays", { milked: milkingDays, total: totalDaysInRange })}
                <br />
                ${t("milkBarChart.average")} ${averageLitersPerDay} ${t("milkBarChart.litersPerMilkingDay")}
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
                    minCategoryWidth={84}
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
