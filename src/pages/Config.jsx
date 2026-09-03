import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Box, Button, Checkbox, Divider, FormControl, FormControlLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { ref, remove } from "firebase/database";
import ViewContainer from "../components/ViewContainer";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { useSurveyNodes } from "../hooks/useSurveyNodes";
import { useSurveyLog } from "../hooks/useSurveyLog";
import { db } from "../firebase";
import { removeItem } from "../utils/persistentStorage";
import { configStyles as styles } from "../theme/Config.styles";

const USAGE_KEYS = [
    "milc_survey_log",
    "milc_telemetry_queue_v1",
    "milc_telemetry_sent_ids_v1",
];
const USAGE_KEY_PREFIXES = ["milc_action_"];

const collectUsageKeys = () => {
    const keys = new Set(USAGE_KEYS);
    for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (USAGE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
            keys.add(key);
        }
    }
    return [...keys];
};

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
    const { currentUser, logout } = useAuth();
    const nodes = useSurveyNodes();
    const { clearLog } = useSurveyLog();
    const [resetState, setResetState] = useState("idle");
    const isSimulatedDateEnabled = Boolean(simulatedDate);
    const nodesTreeVersion = nodes?.timestamp ?? "-";

    const handleResetUsageData = async () => {
        if (!window.confirm(t("config.resetUsageDataConfirm"))) {
            return;
        }

        setResetState("loading");
        try {
            clearLog();

            const keys = collectUsageKeys();
            await Promise.all(keys.map((key) => removeItem(key)));

            if (currentUser?.uid) {
                try {
                    await remove(ref(db, `users/${currentUser.uid}/analytics/events`));
                } catch (err) {
                    console.warn("[config] Could not remove remote analytics events:", err);
                }
            }

            setSimulatedDate("");
            await logout();
            navigate("/login", { replace: true });
        } catch (err) {
            console.error("[config] Failed to reset usage data:", err);
            setResetState("idle");
        }
    };

    return (
        <ViewContainer
            title={t("config.title")}
            onBack={() => navigate("/home")}>
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
                            <Typography sx={styles.label}>{t("config.nodesTreeVersion")}</Typography>
                            <Typography sx={styles.label}>{String(nodesTreeVersion)}</Typography>
                        </Box>
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
                            <Typography sx={styles.label}>{t("config.resetUsageData")}</Typography>
                            <Button
                                variant="contained"
                                color="error"
                                disabled={resetState === "loading"}
                                onClick={handleResetUsageData}>
                                {resetState === "loading"
                                    ? t("common.loading")
                                    : t("config.resetUsageDataAction")}
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </ViewContainer>
    );
};

export default Config;
