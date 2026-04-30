import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Box, Button, Divider, FormControl, MenuItem, Select, Typography } from "@mui/material";
import ViewContainer from "../components/ViewContainer";
import { useSettings } from "../contexts/SettingsContext";
import { refreshSurveyNodes } from "../hooks/useSurveyNodes";
import { configStyles as styles } from "../theme/Config.styles";

const Config = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { language, themeMode, setLanguage, setThemeMode } = useSettings();
    const [refreshState, setRefreshState] = useState("idle"); // "idle" | "loading" | "done"

    const handleRefreshNodes = async () => {
        setRefreshState("loading");
        try {
            await refreshSurveyNodes();
            setRefreshState("done");
            setTimeout(() => setRefreshState("idle"), 2000);
        } catch {
            setRefreshState("idle");
        }
    };

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

                {import.meta.env.DEV && (
                    <>
                        <Divider>
                            <Typography sx={styles.devSectionTitle}>
                                {t("config.devSection")}
                            </Typography>
                        </Divider>
                        <Box sx={styles.settingRow}>
                            <Typography sx={styles.label}>{t("config.resetNodes")}</Typography>
                            <Button
                                variant="outlined"
                                disabled={refreshState !== "idle"}
                                onClick={handleRefreshNodes}>
                                {refreshState === "loading"
                                    ? t("common.loading")
                                    : refreshState === "done"
                                    ? t("config.resetNodesDone")
                                    : t("config.resetNodesAction")}
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </ViewContainer>
    );
};

export default Config;
