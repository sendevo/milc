export const calendarStyles = {
    page: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: "100%",
        pb: 3,
    },
    calendarCard: {
        width: "100%",
        maxWidth: 460,
        alignSelf: "center",
        backgroundColor: "background.paper",
        borderRadius: 3,
        boxShadow: "0 8px 18px rgba(0, 0, 0, 0.08)",
        px: { xs: 1, sm: 2 },
        py: 2,
    },
    monthHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 1,
    },
    monthArrow: {
        color: "text.primary",
    },
    monthTitle: {
        fontWeight: 700,
        textTransform: "capitalize",
    },
    weekdaysRow: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        mb: 1,
    },
    weekdayText: {
        textAlign: "center",
        fontSize: "0.75rem",
        color: "text.secondary",
        fontWeight: 700,
    },
    daysGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: { xs: 0.25, sm: 0.5 },
    },
    emptyCell: {
        width: "100%",
        aspectRatio: "1 / 1",
    },
    dayCell: {
        minWidth: "unset",
        width: "100%",
        aspectRatio: "1 / 1",
        p: 0,
        borderRadius: 1,
        color: "text.primary",
        fontWeight: 600,
        fontSize: { xs: "0.8rem", sm: "0.95rem" },
        backgroundColor: "transparent",
        "&:hover": {
            backgroundColor: "rgba(26, 128, 144, 0.12)",
        },
    },
    dayInRange: {
        backgroundColor: "rgba(45, 197, 162, 0.2)",
    },
    dayEdge: {
        backgroundColor: "#1a8090",
        color: "#ffffff",
        "&:hover": {
            backgroundColor: "#156a76",
        },
    },
    rangeHint: {
        mt: 1,
        fontSize: "0.875rem",
        textAlign: "center",
        color: "text.secondary",
    },
    bottomActions: {
        mt: "auto",
        width: "100%",
        maxWidth: 460,
        alignSelf: "center",
        display: "flex",
        gap: 2,
        pt: 4,
    },
    nextButton: {
        bgcolor: "#1a5f70",
        "&:hover": { bgcolor: "#154f5e" },
    },
};