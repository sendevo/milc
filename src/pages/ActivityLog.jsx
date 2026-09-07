import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
	Box,
	Button,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography
} from "@mui/material";
import { activityStyles as styles } from "../theme/ActivityLog.styles";
import { useSurveyLog } from "../hooks/useSurveyLog";
import { useHerdInventory } from "../hooks/useHerdInventory";
import { useSurveyNodes } from "../hooks/useSurveyNodes";
import ViewContainer from "../components/ViewContainer";
import { exportActivityCsv, getActivityExportHeaders, getActivityExportRows } from "../utils/exportActivityCsv";

const ActivityLog = () => {

	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const nodes = useSurveyNodes();

	const { getRecords } = useSurveyLog();
	const { getRecords: getInventoryRecords } = useHerdInventory();
	const records = useMemo(() => getRecords(), [getRecords]);
	const inventoryRecords = useMemo(() => getInventoryRecords(), [getInventoryRecords]);
	const headers = useMemo(() => getActivityExportHeaders(t), [t]);
	const rows = useMemo(() => getActivityExportRows({
		records,
		inventoryRecords,
		nodes,
		t,
		language: i18n.language,
	}), [i18n.language, inventoryRecords, nodes, records, t]);

	const handleDownloadActivity = () => {
		exportActivityCsv({
			records,
			inventoryRecords,
			nodes,
			t,
			language: i18n.language,
		});
	};

	return (
		<ViewContainer title={t("activityLog.title")} onBack={() => navigate(-1)}>
			<Box sx={styles.page}>
				<TableContainer component={Paper} elevation={0} sx={styles.tableContainer}>
					<Table size="small" stickyHeader>
						<TableHead>
							<TableRow>
								{headers.map((header) => (
									<TableCell key={header} sx={styles.headerCell}>{header}</TableCell>
								))}
							</TableRow>
						</TableHead>
						<TableBody>
							{rows.length === 0 ? (
								<TableRow>
									<TableCell colSpan={headers.length} sx={styles.emptyCell}>
										{t("activityLog.empty")}
									</TableCell>
								</TableRow>
							) : rows.map((row, rowIndex) => (
								<TableRow key={`${row[0]}-${row[1]}-${rowIndex}`} hover>
									{row.map((cell, cellIndex) => (
										<TableCell key={`${rowIndex}-${cellIndex}`} sx={styles.bodyCell}>
											{cell || "-"}
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>

				<Box sx={styles.downloadBox}>
					<Button
						variant="contained"
						sx={styles.downloadButton}
						onClick={handleDownloadActivity}>
						{t("activityLog.downloadMyActivity")}
					</Button>
				</Box>
			</Box>
		</ViewContainer>
	);
};

export default ActivityLog;