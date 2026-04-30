import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Divider, TextField, Typography } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useSurveyNodes } from "../hooks/useSurveyNodes";
import FormCard from "../components/FormCard";
import ViewContainer from "../components/ViewContainer";
import { profileStyles as styles } from "../theme/Profile.styles";

const Profile = () => {
    const { t } = useTranslation();
    const { currentUser, getUserProfile, saveUserProfile, changePassword, logout } = useAuth();
    const navigate = useNavigate();
    const nodes = useSurveyNodes();
    const hasUserProfileSurvey = Boolean(nodes["user-profile"]);

    const [name, setName] = useState("");
    const [place, setPlace] = useState("");
    const [healthCard, setHealthCard] = useState("");
    const [profileError, setProfileError] = useState("");
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);

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
        setProfileError("");
        setProfileSuccess(false);
        setProfileLoading(true);
        try {
            await saveUserProfile(currentUser.uid, {
                name,
                place,
                healthCard,
                email: currentUser.email,
            });
            setProfileSuccess(true);
        } catch {
            setProfileError(t("profile.updateError"));
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
            onBack={() => navigate("/app")}>
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
                    error={profileError}>
                    {profileSuccess && (
                        <Typography variant="body2" color="success.main" textAlign="center">
                            {t("profile.updateSuccess")}
                        </Typography>
                    )}
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
                </FormCard>

                <Box width="100%" maxWidth={380} display="flex" flexDirection="column" gap={1}>
                    <Button
                        type="submit"
                        form="profile-form"
                        variant="contained"
                        fullWidth
                        disabled={profileLoading}
                        sx={styles.submitButton}>
                        {t("profile.saveProfile")}
                    </Button>
                    {hasUserProfileSurvey && (
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => navigate("/survey/user-profile")}>
                            {t("profile.profileSurvey")}
                        </Button>
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
                </FormCard>

                <Box width="100%" maxWidth={380} display="flex" flexDirection="column" gap={1}>
                    <Button
                        type="submit"
                        form="password-form"
                        variant="contained"
                        fullWidth
                        disabled={passwordLoading}
                        sx={styles.submitButton}>
                        {t("profile.changePassword")}
                    </Button>

                    <Divider sx={{ my: 1 }} />

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
