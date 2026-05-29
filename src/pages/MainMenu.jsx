import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";
import ViewContainer from "../components/ViewContainer";
import MenuCircle from "../components/MenuCircle";
import { mainMenuStyles as styles } from "../theme/MainMenu.styles";
import { useSurveyLog } from "../hooks/useSurveyLog";
import { useSurveyNodes } from "../hooks/useSurveyNodes";
import blueGoat from "../assets/icons/blue_goat.png";
import udder from "../assets/icons/udder.png";
import milkPail from "../assets/icons/milk_pail.png";
import goatHealth from "../assets/icons/goat_health.png";
import weed from "../assets/icons/weed.png";
import cattlePen from "../assets/icons/cattle_pen.png";
import barn from "../assets/icons/barn.png";
import pest from "../assets/icons/pest.png";
import sheet from "../assets/icons/sheet.png";
import user from "../assets/icons/user.png";
import config from "../assets/icons/config.png";
import info from "../assets/icons/info_help.png";

const ButtonsContainer = ({ children }) => (
    <Box sx={styles.buttonsContainer}>
        <Box
            display="grid"
            gridTemplateColumns="repeat(3, 1fr)"
            gap={2}
            justifyItems="center">
            {children}
        </Box>
    </Box>
);

const MainMenu = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const theme = useTheme();
    const nodes = useSurveyNodes();
    const { getRecordsByScenario } = useSurveyLog();
    const isDark = theme.palette.mode === "dark";
    const menuBorder = isDark ? "#9e9e9e" : "#1a8090";

    const latestMethodAnswer = useMemo(() => {
        const milkingMethodNodeId = Object.keys(nodes).find((nodeId) =>
            (nodes[nodeId]?.fields || []).some((field) => field?.id === "milk-select")
        );

        if (!milkingMethodNodeId) {
            return null;
        }

        return getRecordsByScenario("APP-SETUP")
            .filter((record) => record.nodeId === milkingMethodNodeId)
            .sort((a, b) => b.timestamp - a.timestamp)[0]?.answer;
    }, [getRecordsByScenario, nodes]);

    const beforeMilkingRoute = useMemo(() => {
        return latestMethodAnswer === "manual"
            ? "/survey/view-124"
            : "/survey/view-109";
    }, [latestMethodAnswer]);

    const milkCareRoute = useMemo(() => {
        return latestMethodAnswer === "manual"
            ? "/survey/view-94"
            : "/survey/view-129";
    }, [latestMethodAnswer]);

    const myDayItems = [
        {
            icon: blueGoat,
            label: t("mainMenu.beforeMilking"),
            onClick: () => navigate(beforeMilkingRoute)
        },
        { 
            icon: udder, 
            label: t("mainMenu.duringMilking"),
            onClick: () => navigate("/survey/view-46") 
        },
        { 
            icon: milkPail, 
            label: t("mainMenu.milkCare"),
            onClick: () => navigate(milkCareRoute)
        },
    ];

    const moreActionItems = [
        { 
            icon: goatHealth, 
            label: t("mainMenu.health"),
            onClick: () => navigate("/survey/view-177") 
        },
        { 
            icon: weed, 
            label: t("mainMenu.food"),
            onClick: () => navigate("/survey/view-184") 
        },
        { 
            icon: cattlePen, 
            label: t("mainMenu.facilities"),
            onClick: () => navigate("/survey/view-196") 
        },
        { 
            icon: barn, 
            label: t("mainMenu.mySupplies"),
            onClick: () => navigate("/survey/view-206") 
        },
        { 
            icon: pest, 
            label: t("mainMenu.pests"),
            onClick: () => navigate("/survey/view-213") 
        },
        { 
            icon: sheet, 
            label: t("mainMenu.myRecords"),
            onClick: () => navigate("/calendar") 
        },
    ];

    const accountActionItems = [
        { 
            icon: user, 
            label: t("mainMenu.myProfile") ,
            onClick: () => navigate("/profile")
        },
        { 
            icon: config, 
            label: t("mainMenu.settings"), 
            onClick: () => navigate("/config") 
        },
        { 
            icon: info, 
            label: t("mainMenu.info"),
            onClick: () => navigate("/info") 
        }
    ];

    return (
        <ViewContainer title={t("mainMenu.panelTitle")}>
            <Box px={2} display="flex" flexDirection="column" gap={3} marginBottom={"20px"}>
                {/* MI DÍA section */}
                <Box>
                    <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        textAlign="center"
                        textTransform="uppercase"
                        sx={styles.sectionTitleFirst}>
                        {t("mainMenu.myDay")}
                    </Typography>
                    <ButtonsContainer>
                        {myDayItems.map((item) => (
                            <MenuCircle
                                key={item.label}
                                icon={item.icon}
                                label={item.label}
                                borderColor={menuBorder}
                                onClick={item.onClick} />
                        ))}
                    </ButtonsContainer>
                </Box>

                {/* MÁS ACCIONES section */}
                <Box>
                    <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        textAlign="center"
                        textTransform="uppercase"
                        sx={styles.sectionTitle}>
                        {t("mainMenu.moreActions")}
                    </Typography>
                    <ButtonsContainer>
                        {moreActionItems.map((item) => (
                            <MenuCircle
                                key={item.label}
                                icon={item.icon}
                                label={item.label}
                                borderColor={menuBorder}
                                onClick={item.onClick} />
                        ))}
                    </ButtonsContainer>
                </Box>

                {/* MI CUENTA section */}
                <Box>
                    <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        textAlign="center"
                        textTransform="uppercase"
                        sx={styles.sectionTitle}>
                        {t("mainMenu.myAccount")}
                    </Typography>
                    <ButtonsContainer>
                        {accountActionItems.map((item) => (
                            <MenuCircle
                                key={item.label}
                                icon={item.icon}
                                label={item.label}
                                borderColor={menuBorder}
                                onClick={item.onClick} />
                        ))}
                    </ButtonsContainer>
                </Box>
            </Box>
        </ViewContainer>
    );
};

export default MainMenu;
