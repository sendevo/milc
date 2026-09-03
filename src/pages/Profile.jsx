import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Divider, TextField, Typography } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useSurveyNodes } from "../hooks/useSurveyNodes";
import { useSurveyLog } from "../hooks/useSurveyLog";
import { useHerdInventory } from "../hooks/useHerdInventory";
import { useToast } from "../contexts/ToastContext";
import { useSettings } from "../contexts/SettingsContext";
import FormCard from "../components/FormCard";
import ViewContainer from "../components/ViewContainer";
import { profileStyles as styles } from "../theme/Profile.styles";
import { MONTH_KEYS } from "../constants/constants";
import { getEffectiveHerdSizeOnDate } from "../utils/herdInventory";
import { formatAsIsoDate } from "../utils/dateTime";

const Profile = () => {
    const { t, i18n } = useTranslation();
    const { currentUser, getUserProfile, saveUserProfile, changePassword, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const nodes = useSurveyNodes();
    const { getRecordsByScenario } = useSurveyLog();
    const { getRecords: getInventoryRecords } = useHerdInventory();
    const { getCurrentDateTime } = useSettings();
    const hasUserProfileSurvey = Boolean(nodes["view-217"]);

    const [name, setName] = useState("");
    const [place, setPlace] = useState("");
    const [healthCard, setHealthCard] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);

    const surveyProfileFields = useMemo(() => {
        const records = getRecordsByScenario("APP-SETUP");
        const inventoryRecords = getInventoryRecords();
        const todayIso = formatAsIsoDate(getCurrentDateTime());
        const effectiveHerdSizeToday = getEffectiveHerdSizeOnDate(records, inventoryRecords, todayIso);
        const latestByNode = {};
        for (const rec of records) {
            if (!latestByNode[rec.nodeId] || rec.timestamp > latestByNode[rec.nodeId].timestamp) {
                latestByNode[rec.nodeId] = rec;
            }
        }

        const lang = i18n.language?.startsWith("es") ? "es" : "en";

        const setupNodes = Object.entries(nodes)
            .filter(([, node]) => node?.scenario === "APP-SETUP")
            .map(([nodeId, node]) => ({ nodeId, node }))
            .filter(({ node }) => {
                const sfn = node["setup-field-name"];
                const label = sfn?.[lang] || sfn?.en || sfn?.es;
                return Boolean(label && label !== "-");
            })
            .sort((a, b) => {
                const aNum = Number((a.nodeId || "").split("-")[1]);
                const bNum = Number((b.nodeId || "").split("-")[1]);
                return (Number.isFinite(aNum) ? aNum : 0) - (Number.isFinite(bNum) ? bNum : 0);
            });

        return setupNodes.flatMap(({ nodeId, node }) => {
                const sfn = node["setup-field-name"];
                const label = sfn?.[lang] || sfn?.en || sfn?.es;
                const rec = latestByNode[nodeId];
                let answerLabel = "";

                if (!rec || rec.answer === null || rec.answer === undefined || rec.answer === "") {
                    return [];
                }

                if (nodeId === "view-220" && effectiveHerdSizeToday !== null) {
                    return [{ label, answerLabel: String(effectiveHerdSizeToday) }];
                }

                answerLabel = String(rec.answer);
                for (const field of (node.fields || [])) {
                    if (field.type === "select") {
                        const opt = (field.options || []).find((o) => o.value === rec.answer);
                        if (opt) {
                            answerLabel = opt.label?.[lang] || opt.label?.en || String(rec.answer);
                            break;
                        }
                    } else if (field.type === "number_input" && rec.answer !== undefined) {
                        answerLabel = String(rec.answer);
                        break;
                    } else if (field.type === "month_picker" && Array.isArray(rec.answer)) {
                        answerLabel = rec.answer
                            .slice()
                            .sort((a, b) => a - b)
                            .map((m) => t(`survey.months.${MONTH_KEYS[m - 1]}`))
                            .join(", ");
                        if (!answerLabel) {
                            return [];
                        }
                        break;
                    }
                }
                return [{ label, answerLabel }];
            });
    }, [getCurrentDateTime, getInventoryRecords, getRecordsByScenario, nodes, i18n.language, t]);

    const hasConfiguredSurveyData = useMemo(
        () => surveyProfileFields.length > 0,
        [surveyProfileFields],
    );

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        getUserProfile(currentUser.uid).then((profile) => {
            if (!profile) return;
            setName(profile.name ?? "");
            setPlace(profile.place ?? "");
            setHealthCard(profile.healthCard ?? "");
        });
    }, [currentUser]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            await saveUserProfile(currentUser.uid, {
                name,
                place,
                healthCard,
                email: currentUser.email,
            });
            showToast(t("profile.updateSuccess"), "success");
        } catch {
            showToast(t("profile.updateError"), "error");
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            return setPasswordError(t("register.passwordMismatch"));
        }
        setPasswordError("");
        setPasswordSuccess(false);
        setPasswordLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            setPasswordSuccess(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch {
            setPasswordError(t("profile.passwordError"));
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    return (
        <ViewContainer
            title={t("profile.title")}
            onBack={() => navigate("/home")}>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                px={3}
                pt={2}
                pb={5}
                gap={3}
                sx={styles.page}>

                {/* Profile info section */}
                <FormCard
                    id="profile-form"
                    onSubmit={handleProfileSubmit}
                    title={t("profile.infoSection")}
                    error="">
                    <TextField
                        placeholder={t("register.name")}
                        label={t("register.name")}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        fullWidth />
                    <TextField
                        placeholder={t("register.place")}
                        label={t("register.place")}
                        type="text"
                        value={place}
                        onChange={(e) => setPlace(e.target.value)}
                        required
                        fullWidth />
                    <TextField
                        placeholder={t("register.healthCard")}
                        label={t("register.healthCard")}
                        type="text"
                        value={healthCard}
                        onChange={(e) => setHealthCard(e.target.value)}
                        required
                        fullWidth />

                    <Box sx={styles.buttonContainer}>
                        <Button
                            type="submit"
                            form="profile-form"
                            variant="contained"
                            fullWidth
                            disabled={profileLoading}
                            sx={styles.submitButton}>
                            {t("profile.saveProfile")}
                        </Button>
                    </Box>
                </FormCard>

                <Box sx={styles.surveyDataBox}>
                    <Typography
                        variant="h6"
                        textAlign="center"
                        fontWeight="bold"
                        textTransform="uppercase"
                        sx={{ color: "text.primary", mb: 1 }}>
                        {t("profile.surveyDataSection")}
                    </Typography>
                    
                    {surveyProfileFields.map(({ label, answerLabel }, i) => (
                        <Box key={i} sx={styles.surveyDataRow}>
                            <Typography sx={styles.surveyDataLabel}>{label}</Typography>
                            <Typography sx={styles.surveyDataValue}>{answerLabel}</Typography>
                        </Box>
                    ))}                    
                
                    {hasUserProfileSurvey && (
                        <Box sx={{...styles.buttonContainer, mt:1}}>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => navigate("/survey/view-217")}>
                                {hasConfiguredSurveyData
                                    ? t("profile.profileSurveyUpdate")
                                    : t("profile.profileSurveyComplete")}
                            </Button>
                        </Box>
                    )}
                </Box>

                <Divider sx={{ width: "100%", maxWidth: 380 }} />

                {/* Change password section */}
                <FormCard
                    id="password-form"
                    onSubmit={handlePasswordSubmit}
                    title={t("profile.passwordSection")}
                    error={passwordError}>
                    {passwordSuccess && (
                        <Typography variant="body2" color="success.main" textAlign="center">
                            {t("profile.passwordSuccess")}
                        </Typography>
                    )}
                    <TextField
                        placeholder={t("profile.currentPassword")}
                        label={t("profile.currentPassword")}
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        fullWidth />
                    <TextField
                        placeholder={t("profile.newPassword")}
                        label={t("profile.newPassword")}
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        fullWidth />
                    <TextField
                        placeholder={t("register.confirmPassword")}
                        label={t("register.confirmPassword")}
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        fullWidth />

                    <Box sx={{...styles.buttonContainer, mt: 1}}>
                        <Button
                            type="submit"
                            form="password-form"
                            variant="contained"
                            fullWidth
                            disabled={passwordLoading}
                            sx={styles.submitButton}>
                            {t("profile.changePassword")}
                        </Button>
                    </Box>
                </FormCard>

                <Box sx={{...styles.buttonContainer, mt: 1}}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleLogout}
                        sx={styles.logoutButton}>
                        {t("mainMenu.logout")}
                    </Button>
                </Box>
            </Box>
        </ViewContainer>
    );
};

export default Profile;
