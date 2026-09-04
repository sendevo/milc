import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Box, Button, Checkbox, Divider, FormControl, FormControlLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { ref, remove } from "firebase/database";
import ViewContainer from "../components/ViewContainer";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { useSurveyNodes } from "../hooks/useSurveyNodes";
import { useSurveyLog } from "../hooks/useSurveyLog";
import { useHerdInventory } from "../hooks/useHerdInventory";
import { db } from "../firebase";
import { removeItem } from "../utils/persistentStorage";
import { configStyles as styles } from "../theme/Config.styles";
import { exportActivityCsv } from "../utils/exportActivityCsv";
import { importActivityCsv } from "../utils/importActivityCsv";
import { USAGE_KEYS, USAGE_KEY_PREFIXES, DEV_TOOLS_ENABLED } from "../constants";

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
    const { t, i18n } = useTranslation();
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
    const { clearLog, getRecords, saveAnswer } = useSurveyLog();
    const { clearLog: clearInventoryLog, getRecords: getInventoryRecords } = useHerdInventory();
    const [resetState, setResetState] = useState("idle");
    const [importState, setImportState] = useState("idle");
    const fileInputRef = useRef(null);
    const isSimulatedDateEnabled = Boolean(simulatedDate);
    const nodesTreeVersion = nodes?.timestamp ?? "-";

    const handleResetUsageData = async () => {
        if (!window.confirm(t("config.resetUsageDataConfirm"))) {
            return;
        }

        setResetState("loading");
        try {
            clearLog();
            clearInventoryLog();

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

    const handleDownloadActivity = () => {
        exportActivityCsv({
            records: getRecords(),
            inventoryRecords: getInventoryRecords(),
            nodes,
            t,
            language: i18n.language,
        });
    };

    const handleImportActivity = () => {
        if (!window.confirm(t("config.importActivityDataConfirm"))) {
            return;
        }
        fileInputRef.current?.click();
    };

    const handleImportFile = async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const csvText = await file.text();
            const result = importActivityCsv({
                csvText,
                nodes,
                saveAnswer,
            });

            setImportState(result.imported > 0 ? "success" : "empty");
            window.alert(`Imported ${result.imported} interaction rows. Skipped ${result.skipped}.`);
        } catch (err) {
            console.error("[config] Failed to import activity CSV:", err);
            setImportState("error");
            window.alert("The CSV could not be imported. Please check the column names and values.");
        } finally {
            event.target.value = "";
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

                <Box sx={styles.settingRow}>
                    <Typography sx={styles.label}>{t("config.downloadMyActivity")}</Typography>
                    <Button
                        variant="contained"
                        onClick={handleDownloadActivity}>
                        {t("config.downloadMyActivity")}
                    </Button>
                </Box>

                {DEV_TOOLS_ENABLED && (
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

                        <Box sx={styles.settingRow}>
                            <Typography sx={styles.label}>{t("config.importActivity")}</Typography>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleImportActivity}>
                                {t("config.importActivity")}
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,text/csv"
                                hidden
                                onChange={handleImportFile}
                            />
                        </Box>
                    </>
                )}
            </Box>
        </ViewContainer>
    );
};

export default Config;
