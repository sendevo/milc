import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Box, FormControl, MenuItem, Select, Typography } from "@mui/material";
import ViewContainer from "../components/ViewContainer";
import { useSettings } from "../contexts/SettingsContext";
import { configStyles as styles } from "../theme/Config.styles";

const Config = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { language, themeMode, setLanguage, setThemeMode } = useSettings();

    return (
        <ViewContainer
            title={t("config.title")}
            onBack={() => navigate("/app")}>
            <Box sx={styles.container}>
                <Box sx={styles.settingRow}>
                    <Typography sx={styles.label}>{t("config.language")}</Typography>
                    <FormControl sx={styles.control}>
                        <Select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}>
                            <MenuItem value="es">{t("config.spanish")}</MenuItem>
                            <MenuItem value="en">{t("config.english")}</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={styles.settingRow}>
                    <Typography sx={styles.label}>{t("config.theme")}</Typography>
                    <FormControl sx={styles.control}>
                        <Select
                            value={themeMode}
                            onChange={(e) => setThemeMode(e.target.value)}>
                            <MenuItem value="light">{t("config.light")}</MenuItem>
                            <MenuItem value="dark">{t("config.dark")}</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>
        </ViewContainer>
    );
};

export default Config;
