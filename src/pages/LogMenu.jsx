import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ViewContainer from "../components/ViewContainer";
import MenuButtonContainer from "../components/MenuButtonContainer";
import MenuCircle from "../components/MenuCircle";
import { menusStyles as styles } from "../theme/Menus.styles";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useSurveyLog } from "../hooks/useSurveyLog";
import { useHerdInventory } from "../hooks/useHerdInventory";
import { useSurveyNodes } from "../hooks/useSurveyNodes";
import { parseIsoDate, getDaysBetweenInclusive } from "../utils/dateTime";
import { computeReportStats, buildSafetyData, buildSetupData } from "../utils/reportData";
import { downloadReportPdf } from "../utils/reportPdf";
import { downloadDailyRowsXlsx } from "../utils/reportXlsx";
import blueGoat from "../assets/icons/blue_goat.png";
import milkPail from "../assets/icons/milk_pail.png";
import downloadDocumentPDF from "../assets/icons/download_document_pdf.png";
import downloadDocumentXLS from "../assets/icons/download_document_xlsx.png";


const LogMenu = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const theme = useTheme();
    const { currentUser, getUserProfile } = useAuth();
    const { showToast } = useToast();
    const { getRecords } = useSurveyLog();
    const { getRecords: getInventoryRecords } = useHerdInventory();
    const nodes = useSurveyNodes();
    const isDark = theme.palette.mode === "dark";
    const menuBorder = isDark ? "#9e9e9e" : "#1a8090";

    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";

    const handleDownloadReportPDF = async () => {
        try {
            const records = getRecords();
            const inventoryRecords = getInventoryRecords();
            const from = parseIsoDate(fromDate);
            const to = parseIsoDate(toDate);
            const language = i18n.language;

            const stats = computeReportStats(records, inventoryRecords, from, to, language);
            const safetyAspects = buildSafetyData(records, nodes, from, to, t);
            const setup = buildSetupData(nodes, records, t);
            const profile = currentUser?.uid
                ? await getUserProfile(currentUser.uid)
                : null;

            const dairyCategories = stats.dairyBuckets.map((item) => item.label);
            const dairySeries = [
                {
                    label: t("dairyBarChart.totalAnimals"),
                    data: stats.dairyBuckets.map((item) => item.total),
                    color: { from: "#2dc5a2", to: "#1a8090" },
                },
                {
                    label: t("dairyBarChart.milkedAnimals"),
                    data: stats.dairyBuckets.map((item) => item.milked),
                    color: { from: "#74b3ff", to: "#2f6ad9" },
                },
            ];

            const milkCategories = stats.milkSeries.map((item) => item.label);
            const milkSeries = [{
                label: t("milkBarChart.liters"),
                data: stats.milkSeries.map((item) => item.value),
                color: { from: "#f6c344", to: "#d18b00" },
            }];

            const isMonthlyGrouped = Boolean(from && to && from <= to && getDaysBetweenInclusive(from, to) > 31);

            await downloadReportPdf({
                t,
                fromDate,
                toDate,
                profile,
                setup,
                dairy: {
                    categories: dairyCategories,
                    series: dairySeries,
                    xAxisLabel: isMonthlyGrouped ? t("dairyBarChart.months") : t("dairyBarChart.days"),
                    averageTotalAnimals: stats.averageTotalAnimals,
                    averageMilkedAnimals: stats.averageMilkedAnimals,
                },
                milk: {
                    categories: milkCategories,
                    series: milkSeries,
                    xAxisLabel: isMonthlyGrouped ? t("milkBarChart.months") : t("milkBarChart.days"),
                    totalLiters: stats.totalLiters,
                    averageLitersPerDay: stats.averageLitersPerDay,
                    litersPerAnimal: stats.litersPerAnimal,
                },
                dailyRows: stats.dailyRows,
                safetyAspects,
                fileName: `${t("report.fileName")}_${fromDate || "all"}_${toDate || "all"}.pdf`,
            });

            showToast(t("report.downloadSuccess"), "success");
        } catch (error) {
            console.error("[report] download failed", error);
            showToast(t("report.downloadError"), "error");
        }
    };

    const handleDownloadReportXLSX = async () => {
        try {
            const records = getRecords();
            const inventoryRecords = getInventoryRecords();
            const from = parseIsoDate(fromDate);
            const to = parseIsoDate(toDate);
            const language = i18n.language;

            const stats = computeReportStats(records, inventoryRecords, from, to, language);

            downloadDailyRowsXlsx({
                t,
                dailyRows: stats.dailyRows,
                fromDate,
                toDate,
                fileName: `${t("report.fileName")}_${fromDate || "all"}_${toDate || "all"}.xlsx`,
            });

            showToast(t("report.downloadSuccess"), "success");
        } catch (error) {
            console.error("[report] xlsx download failed", error);
            showToast(t("report.downloadError"), "error");
        }
    };

    const viewItems = [
        {
            icon: milkPail,
            label: t("logMenu.dairyData"),
            onClick: () => navigate(`/dairybarchart?${searchParams.toString()}`),
        },
        { 
            icon: blueGoat, 
            label: t("logMenu.systemSafety"),
            onClick: () => navigate(`/resultscales?${searchParams.toString()}`),
        },
    ];

    const reportItems = [
        { 
            icon: downloadDocumentPDF, 
            label: t("logMenu.downloadReportPDF"),
            onClick: handleDownloadReportPDF,
        },
        { 
            icon: downloadDocumentXLS, 
            label: t("logMenu.downloadReportXLSX"),
            onClick: handleDownloadReportXLSX,
        }
    ];

    return (
        <ViewContainer 
            title={t("logMenu.panelTitle")}
            onBack={() => navigate("/calendar")}>
            <Box
                display="flex"
                justifyContent="center"
                mt={3}>
                <Typography sx={{
                    textAlign: "center",
                    fontWeight: 600,
                    color: "text.secondary",
                }}>
                    {t("logMenu.period")}: {fromDate} / {toDate}
                </Typography>
            </Box>
            <Box 
                px={2} 
                display="flex" 
                flexDirection="column" 
                gap={3} 
                marginBottom={"20px"}>
                <Box>
                    <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        textAlign="center"
                        textTransform="uppercase"
                        sx={styles.sectionTitleFirst}>
                        {t("logMenu.view")}
                    </Typography>
                    <MenuButtonContainer>
                        {viewItems.map((item) => (
                            <MenuCircle
                                key={item.label}
                                icon={item.icon}
                                label={item.label}
                                borderColor={menuBorder}
                                onClick={item.onClick} />
                        ))}
                    </MenuButtonContainer>
                </Box>
                <Box>
                    <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        textAlign="center"
                        textTransform="uppercase"
                        sx={styles.sectionTitle}>
                        {t("logMenu.myRecords")}
                    </Typography>
                    <MenuButtonContainer>
                        {reportItems.map((item) => (
                            <MenuCircle
                                key={item.label}
                                icon={item.icon}
                                label={item.label}
                                borderColor={menuBorder}
                                onClick={item.onClick} />
                        ))}
                    </MenuButtonContainer>
                </Box>
            </Box>
        </ViewContainer>
    );
};

export default LogMenu;
