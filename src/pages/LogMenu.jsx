import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ViewContainer from "../components/ViewContainer";
import MenuButtonContainer from "../components/MenuButtonContainer";
import MenuCircle from "../components/MenuCircle";
import { menusStyles as styles } from "../theme/Menus.styles";
import blueGoat from "../assets/icons/blue_goat.png";
import milkPail from "../assets/icons/milk_pail.png";
import downloadDocument from "../assets/icons/download_document.png";


const LogMenu = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const menuBorder = isDark ? "#9e9e9e" : "#1a8090";

    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";

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
            icon: downloadDocument, 
            label: t("logMenu.downloadReport"),
            onClick: () => {
                // Placeholder for report generation logic
                console.log("Download report");
            }
        },
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
