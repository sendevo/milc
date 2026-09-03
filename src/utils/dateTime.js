export const toDayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const isSameDay = (a, b) =>
	a &&
	b &&
	a.getFullYear() === b.getFullYear() &&
	a.getMonth() === b.getMonth() &&
	a.getDate() === b.getDate();

export const parseIsoDate = (value) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }
    return date;
};

export const getDaysBetweenInclusive = (startDate, endDate) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return Math.floor((end - start) / msPerDay) + 1;
};

export const formatAsIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const getMonthSpanInclusive = (startDate, endDate) => {
    const fromYear = startDate.getFullYear();
    const fromMonth = startDate.getMonth();
    const toYear = endDate.getFullYear();
    const toMonth = endDate.getMonth();
    return (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
};

export const subtractMonthsClamped = (date, months) => {
	const targetMonth = new Date(date.getFullYear(), date.getMonth() - months, 1);
	const maxDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
	return new Date(
		targetMonth.getFullYear(),
		targetMonth.getMonth(),
		Math.min(date.getDate(), maxDay),
	);
};

export const getPredefinedRange = (period, referenceDate) => {
	const endDate = toDayStart(referenceDate);

	switch (period) {
		case "lastWeek":
			return {
				from: new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 6),
				to: endDate,
			};
		case "lastMonth":
			return {
				from: subtractMonthsClamped(endDate, 1),
				to: endDate,
			};
		case "lastSixMonths":
			return {
				from: subtractMonthsClamped(endDate, 6),
				to: endDate,
			};
		default:
			return null;
	}
};