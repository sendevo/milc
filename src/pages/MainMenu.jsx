import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ViewContainer from "../components/ViewContainer";
import MenuCircle from "../components/MenuCircle";
import { mainMenuStyles as styles } from "../theme/MainMenu.styles";
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
    const isDark = theme.palette.mode === "dark";
    const tealBorder = isDark ? "#2dc5a2" : "#1a8090";
    const greyBorder = isDark ? "#aaaaaa" : "#757575";

    const myDayItems = [
        {
            icon: blueGoat,
            label: t("mainMenu.beforeMilking"),
            onClick: () => navigate("/survey/before-milking-start"),
        },
        { icon: udder, label: t("mainMenu.duringMilking") },
        { icon: milkPail, label: t("mainMenu.milkCare") },
    ];

    const moreActionItems = [
        { icon: goatHealth, label: t("mainMenu.health") },
        { icon: weed, label: t("mainMenu.food") },
        { icon: cattlePen, label: t("mainMenu.facilities") },
        { icon: barn, label: t("mainMenu.mySupplies") },
        { icon: pest, label: t("mainMenu.pests") },
        { icon: sheet, label: t("mainMenu.myRecords") },
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
                                borderColor={tealBorder}
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
                                borderColor={greyBorder} />
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
                                borderColor={greyBorder}
                                onClick={item.onClick} />
                        ))}
                    </ButtonsContainer>
                </Box>
            </Box>
        </ViewContainer>
    );
};

export default MainMenu;
