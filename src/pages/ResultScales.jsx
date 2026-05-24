import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Box, Button, Divider, IconButton, Typography } from "@mui/material";
import ViewContainer from "../components/ViewContainer";
import { resultScalesStyles as styles } from "../theme/ResultScales.styles";
import blueGoat from "../assets/icons/blue_goat.png";
import udder from "../assets/icons/udder.png";
import milkPail from "../assets/icons/milk_pail.png";
import goatHealth from "../assets/icons/goat_health.png";
import weed from "../assets/icons/weed.png";
import cattlePen from "../assets/icons/cattle_pen.png";
import barn from "../assets/icons/barn.png";
import pest from "../assets/icons/pest.png";
import checkTrue from "../assets/icons/check_true.png";
import checkFalse from "../assets/icons/check_false.png";

const RESULT_VIEW_BY_RATING = {
    4: "view-result-excellent",
    3: "view-result-good",
    2: "view-result-regular",
    1: "view-result-bad",
};

const ResultScales = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const aspects = [
        { icon: blueGoat, label: t("mainMenu.beforeMilking"), rating: 4 },
        { icon: udder, label: t("mainMenu.duringMilking"), rating: 3 },
        { icon: milkPail, label: t("mainMenu.milkCare"), rating: 1 },
        { icon: goatHealth, label: t("mainMenu.health"), rating: 2 },
        { icon: weed, label: t("mainMenu.food"), rating: 4 },
        { icon: cattlePen, label: t("mainMenu.facilities"), rating: 3 },
        { icon: barn, label: t("mainMenu.mySupplies"), rating: 2 },
        { icon: pest, label: t("mainMenu.pests"), rating: 1 },
    ];

    const handleAspectClick = (rating) => {
        const targetView = RESULT_VIEW_BY_RATING[rating];
        if (!targetView) return;
        navigate(`/survey/${targetView}`);
    };

    return (
        <ViewContainer
            title={t("resultScales.title")}
            showDate>
            <Box sx={styles.page}>
                <Box sx={styles.rowsContainer}>
                    {aspects.map((aspect, index) => (
                        <Box key={`${index}-${aspect.rating}`}>
                            <Box sx={styles.row}>
                                <Box sx={styles.aspectColumn}>
                                    <IconButton
                                        onClick={() => handleAspectClick(aspect.rating)}
                                        sx={styles.aspectButton(true)}>
                                        <img src={aspect.icon} alt={aspect.label} style={styles.aspectIcon} />
                                    </IconButton>
                                    <Typography sx={styles.aspectLabel}>{aspect.label}</Typography>
                                </Box>

                                <Box sx={styles.ratingContainer}>
                                    {Array.from({ length: 4 }, (_, i) => (
                                        <img
                                            key={`${index}-check-${i}`}
                                            src={i < aspect.rating ? checkTrue : checkFalse}
                                            alt={i < aspect.rating ? "checked" : "unchecked"}
                                            style={styles.ratingIcon}
                                        />
                                    ))}
                                </Box>
                            </Box>
                            {index < aspects.length - 1 && <Divider sx={styles.rowDivider} />}
                        </Box>
                    ))}
                </Box>

                <Box sx={styles.bottomActions}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate("/milkbarchart")}>
                        {t("resultScales.back")}
                    </Button>
                </Box>
            </Box>
        </ViewContainer>
    );
};

export default ResultScales;
