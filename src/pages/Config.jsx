import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Box, Button, Checkbox, Divider, FormControl, FormControlLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import ViewContainer from "../components/ViewContainer";
import { useSettings } from "../contexts/SettingsContext";
import { refreshSurveyNodes } from "../hooks/useSurveyNodes";
import { configStyles as styles } from "../theme/Config.styles";

const Config = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const today = new Date().toISOString().slice(0, 10);
    const {
        language,
        themeMode,
        simulatedDate,
        setLanguage,
        setThemeMode,
        setSimulatedDate,
    } = useSettings();
    const [refreshState, setRefreshState] = useState("idle"); // "idle" | "loading" | "done"
    const isSimulatedDateEnabled = Boolean(simulatedDate);

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
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isSimulatedDateEnabled}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSimulatedDate(simulatedDate || today);
                                                return;
                                            }
                                            setSimulatedDate("");
                                        }}
                                    />
                                }
                                label={<Typography sx={styles.label}>{t("config.enableSimulatedDate")}</Typography>}
                            />
                            <Box sx={styles.devDateControlWrap}>
                                <TextField
                                    type="date"
                                    size="small"
                                    disabled={!isSimulatedDateEnabled}
                                    value={isSimulatedDateEnabled ? (simulatedDate || today) : today}
                                    onChange={(e) => setSimulatedDate(e.target.value || today)}
                                    slotProps={{
                                        htmlInput: {
                                            max: "9999-12-31",
                                        },
                                    }}
                                />
                            </Box>
                        </Box>

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
