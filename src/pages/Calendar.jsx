import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ViewContainer from "../components/ViewContainer";
import { calendarStyles as styles } from "../theme/Calendar.styles";

const toDayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatAsIsoDate = (date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
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

	for (let i = 0; i < firstWeekday; i += 1) {
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

const Calendar = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const today = toDayStart(new Date());
	const [displayMonth, setDisplayMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
	const [fromDate, setFromDate] = useState(null);
	const [toDate, setToDate] = useState(null);

	const isRangeValid = useMemo(() => {
		if (!fromDate || !toDate) return false;
		return fromDate.getTime() <= toDate.getTime();
	}, [fromDate, toDate]);

	const weekdayHeaders = useMemo(() => {
		const formatter = new Intl.DateTimeFormat("es-AR", { weekday: "short" });
		const baseSunday = new Date(2024, 0, 7);
		return Array.from({ length: 7 }, (_, idx) => {
			const date = new Date(baseSunday);
			date.setDate(baseSunday.getDate() + idx);
			return formatter.format(date).slice(0, 2).toUpperCase();
		});
	}, []);

	const monthLabel = useMemo(
		() =>
			new Intl.DateTimeFormat("es-AR", {
				month: "long",
				year: "numeric",
			}).format(displayMonth),
		[displayMonth],
	);

	const daysMatrix = useMemo(() => buildMonthMatrix(displayMonth), [displayMonth]);

	const handlePrevMonth = () => {
		setDisplayMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
	};

	const handleNextMonth = () => {
		setDisplayMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
	};

	const handleDayClick = (date) => {
		const clickedDay = toDayStart(date);

		if (!fromDate || (fromDate && toDate)) {
			setFromDate(clickedDay);
			setToDate(null);
			return;
		}

		if (clickedDay.getTime() < fromDate.getTime()) {
			setToDate(fromDate);
			setFromDate(clickedDay);
			return;
		}

		setToDate(clickedDay);
	};

	const handleNext = () => {
		if (!fromDate || !toDate) return;
		const params = new URLSearchParams({
			fromDate: formatAsIsoDate(fromDate),
			toDate: formatAsIsoDate(toDate),
		});
		navigate(`/milkbarchart?${params.toString()}`);
	};

	return (
		<ViewContainer
			title={t("calendar.title")}
			subtitle={t("calendar.subtitle")}
			onBack={() => navigate("/app")}
			showDate>
			<Box sx={styles.page}>
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

							const isStart = isSameDay(date, fromDate);
							const isEnd = isSameDay(date, toDate);
							const isSingle = Boolean(isStart && !toDate);
							const isBetween = Boolean(
								fromDate &&
								toDate &&
								date.getTime() > fromDate.getTime() &&
								date.getTime() < toDate.getTime(),
							);

							return (
								<Button
									key={date.toISOString()}
									onClick={() => handleDayClick(date)}
									sx={{
										...styles.dayCell,
										...(isBetween ? styles.dayInRange : {}),
										...(isStart || isEnd || isSingle ? styles.dayEdge : {}),
									}}>
									{date.getDate()}
								</Button>
							);
						})}
					</Box>
				</Box>

				<Box sx={styles.bottomActions}>
					<Button
						variant="outlined"
						fullWidth
						onClick={() => navigate("/app")}>
						{t("calendar.back")}
					</Button>
					<Button
						variant="contained"
						fullWidth
						disabled={!isRangeValid}
						onClick={handleNext}
						sx={styles.nextButton}>
						{t("calendar.next")}
					</Button>
				</Box>
			</Box>
		</ViewContainer>
	);
};

export default Calendar;
