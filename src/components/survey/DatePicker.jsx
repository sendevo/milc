import { useMemo, useState } from "react";
import { Box, Button, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useTranslation } from "react-i18next";
import { datePickerStyles as styles } from "../../theme/survey/DatePicker.styles";

const toDayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatAsIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const parseIsoDate = (value) => {
    if (typeof value !== "string") return null;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const buildMonthMatrix = (displayMonth) => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = firstDay.getDay();
    const cells = [];

    for (let index = 0; index < firstWeekday; index += 1) {
        cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        cells.push(new Date(year, month, day));
    }

    while (cells.length < 42) {
        cells.push(null);
    }

    return cells;
};

const DatePicker = ({ value = "", onChange, onSave }) => {
    const { t, i18n } = useTranslation();
    const today = toDayStart(new Date());
    const initialDate = parseIsoDate(value);
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [displayMonth, setDisplayMonth] = useState(
        new Date((initialDate ?? today).getFullYear(), (initialDate ?? today).getMonth(), 1)
    );

    const locale = i18n.language?.slice(0, 2) === "en" ? "en-US" : "es-AR";

    const weekdayHeaders = useMemo(() => {
        const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
        const baseSunday = new Date(2024, 0, 7);
        return Array.from({ length: 7 }, (_, idx) => {
            const date = new Date(baseSunday);
            date.setDate(baseSunday.getDate() + idx);
            return formatter.format(date).slice(0, 2).toUpperCase();
        });
    }, [locale]);

    const monthLabel = useMemo(
        () =>
            new Intl.DateTimeFormat(locale, {
                month: "long",
                year: "numeric",
            }).format(displayMonth),
        [displayMonth, locale]
    );

    const daysMatrix = useMemo(() => buildMonthMatrix(displayMonth), [displayMonth]);

    const selectedValue = selectedDate ? formatAsIsoDate(selectedDate) : "";

    const handlePrevMonth = () => {
        setDisplayMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setDisplayMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
    };

    const handleDayClick = (date) => {
        const nextDate = toDayStart(date);
        const nextValue = formatAsIsoDate(nextDate);
        setSelectedDate(nextDate);
        onChange?.(nextValue);
    };

    return (
        <Box sx={styles.container}>
            <Box sx={styles.calendarCard}>
                <Box sx={styles.monthHeader}>
                    <IconButton onClick={handlePrevMonth} size="small" sx={styles.monthArrow}>
                        <ChevronLeftIcon />
                    </IconButton>
                    <Typography sx={styles.monthTitle}>{monthLabel}</Typography>
                    <IconButton onClick={handleNextMonth} size="small" sx={styles.monthArrow}>
                        <ChevronRightIcon />
                    </IconButton>
                </Box>

                <Box sx={styles.weekdaysRow}>
                    {weekdayHeaders.map((weekday) => (
                        <Typography key={weekday} sx={styles.weekdayText}>
                            {weekday}
                        </Typography>
                    ))}
                </Box>

                <Box sx={styles.daysGrid}>
                    {daysMatrix.map((date, idx) => {
                        if (!date) {
                            return <Box key={`empty-${idx}`} sx={styles.emptyCell} />;
                        }

                        const isSelected = isSameDay(date, selectedDate);

                        return (
                            <Button
                                key={date.toISOString()}
                                onClick={() => handleDayClick(date)}
                                sx={{
                                    ...styles.dayCell,
                                    ...(isSelected ? styles.daySelected : {}),
                                }}>
                                {date.getDate()}
                            </Button>
                        );
                    })}
                </Box>
            </Box>

            <Typography sx={styles.selectionHint}>
                {selectedValue || t("survey.save")}
            </Typography>

            <Button
                variant="contained"
                fullWidth
                disabled={!selectedValue}
                onClick={() => onSave?.(selectedValue)}
                sx={styles.saveButton}>
                {t("survey.save")}
            </Button>
        </Box>
    );
};

export default DatePicker;