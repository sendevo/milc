import { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { barChartStyles as styles } from "../theme/BarChart.styles";

const DEFAULT_GRADIENTS = [
    { from: "#2dc5a2", to: "#1a8090" },
    { from: "#74b3ff", to: "#2f6ad9" },
    { from: "#f6c344", to: "#d18b00" },
    { from: "#f28b82", to: "#d24a43" },
];

const toNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
};

const toGradient = (color, fallback) => {
    if (!color) return fallback;
    if (typeof color === "string") {
        return { from: color, to: color };
    }
    return {
        from: color.from || fallback.from,
        to: color.to || fallback.to,
    };
};

const BarChart = ({
    categories = [],
    series = [],
    yAxisLabel = "",
    xAxisLabel = "",
    showGrid = false,
    showValues = true,
    showLegend,
}) => {
    const theme = useTheme();

    const categoryCount = useMemo(() => {
        if (Array.isArray(categories) && categories.length > 0) return categories.length;
        return Math.max(0, ...series.map((entry) => Array.isArray(entry.data) ? entry.data.length : 0));
    }, [categories, series]);

    const resolvedCategories = useMemo(() => {
        if (Array.isArray(categories) && categories.length > 0) return categories;
        return Array.from({ length: categoryCount }, (_, index) => String(index + 1));
    }, [categories, categoryCount]);

    const paletteDefaults = useMemo(() => {
        const primary = theme.palette.primary?.main || "#2dc5a2";
        const secondary = theme.palette.secondary?.main || "#74b3ff";
        const success = theme.palette.success?.main || "#4caf50";
        const warning = theme.palette.warning?.main || "#ff9800";
        return [
            { from: "#2dc5a2", to: "#1a8090" },
            { from: secondary, to: secondary },
            { from: success, to: success },
            { from: warning, to: warning },
            { from: primary, to: primary },
        ];
    }, [theme.palette]);

    const normalizedSeries = useMemo(() => {
        return series.map((entry, seriesIndex) => {
            const fallbackGradient = paletteDefaults[seriesIndex] || DEFAULT_GRADIENTS[seriesIndex % DEFAULT_GRADIENTS.length];
            const gradient = toGradient(entry.color, fallbackGradient);
            const values = resolvedCategories.map((_, dataIndex) => toNumber(entry.data?.[dataIndex]));
            return {
                ...entry,
                values,
                color: gradient,
                label: entry.label || `Series ${seriesIndex + 1}`,
            };
        });
    }, [paletteDefaults, resolvedCategories, series]);

    const maxValue = useMemo(() => {
        const values = normalizedSeries.flatMap((entry) => entry.values);
        const max = values.length ? Math.max(...values) : 0;
        return max > 0 ? max : 1;
    }, [normalizedSeries]);

    const shouldShowLegend = typeof showLegend === "boolean"
        ? showLegend
        : normalizedSeries.length > 1;

    return (
        <Box sx={styles.chartCard}>
            {yAxisLabel ? (
                <Typography sx={styles.chartTopUnit}>{yAxisLabel}</Typography>
            ) : null}

            {shouldShowLegend ? (
                <Box sx={styles.legendBox}>
                    {normalizedSeries.map((entry) => (
                        <Box key={entry.label} sx={styles.legendItem}>
                            <Box
                                sx={{
                                    ...styles.legendSwatch,
                                    background: `linear-gradient(180deg, ${entry.color.from} 0%, ${entry.color.to} 100%)`,
                                }}
                            />
                            <Typography sx={styles.legendLabel}>{entry.label}</Typography>
                        </Box>
                    ))}
                </Box>
            ) : null}

            <Box sx={styles.chartArea}>
                {showGrid ? (
                    <Box sx={styles.gridLayer}>
                        {[0.25, 0.5, 0.75, 1].map((step) => (
                            <Box
                                key={step}
                                sx={{
                                    ...styles.gridLine,
                                    bottom: `${step * 100}%`,
                                }}
                            />
                        ))}
                    </Box>
                ) : null}

                {resolvedCategories.map((label, categoryIndex) => (
                    <Box key={`${label}-${categoryIndex}`} sx={styles.barItem}>
                        {showValues ? (
                            <Typography sx={styles.barValue}>
                                {normalizedSeries.map((entry) => entry.values[categoryIndex]).join(" / ")}
                            </Typography>
                        ) : null}
                        <Box sx={styles.barTrack}>
                            {normalizedSeries.map((entry) => {
                                const value = entry.values[categoryIndex];
                                const ratio = value <= 0 ? 0 : value / maxValue;
                                const barHeight = ratio <= 0 ? "0%" : `${Math.max(8, ratio * 100)}%`;
                                return (
                                    <Box
                                        key={`${entry.label}-${categoryIndex}`}
                                        sx={{
                                            ...styles.barFill,
                                            height: barHeight,
                                            background: `linear-gradient(180deg, ${entry.color.from} 0%, ${entry.color.to} 100%)`,
                                        }}
                                    />
                                );
                            })}
                        </Box>
                        <Typography sx={styles.barLabel}>{label}</Typography>
                    </Box>
                ))}
            </Box>

            {xAxisLabel ? (
                <Typography sx={styles.chartBottomUnit}>{xAxisLabel}</Typography>
            ) : null}
        </Box>
    );
};

export default BarChart;
