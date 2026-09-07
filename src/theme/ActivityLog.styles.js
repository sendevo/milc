export const activityStyles = {
	page: {
		display: "flex",
		flexDirection: "column",
		gap: 2,
		px: 2,
		pt: 2,
		pb: 3,
	},
	tableContainer: {
		maxHeight: "60vh",
		border: "1px solid",
		borderColor: "divider",
		borderRadius: 2,
		bgcolor: "background.paper",
	},
	headerCell: {
		fontWeight: 700,
		bgcolor: "background.default",
		whiteSpace: "nowrap",
	},
	bodyCell: {
		verticalAlign: "top",
	},
	emptyCell: {
		py: 4,
		textAlign: "center",
		color: "text.secondary",
	},
	caption: {
		fontWeight: 600,
		fontSize: "0.95rem",
	},
	downloadBox: {
		display: "flex",
		mt: 2,
		mb: 2,
		gap: 1,
		flexWrap: "wrap",
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
	},
	downloadButton: {
		alignSelf: "flex-start",
	},
};