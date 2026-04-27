import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "../contexts/AuthContext";
import FormCard from "../components/FormCard";
import { loginStyles as styles } from "../theme/Login.styles";
import { captchaDialogStyles as captchaStyles } from "../theme/CaptchaDialog.styles";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const Login = () => {
    const { t } = useTranslation();
    const { login, loginAnonymously } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [captchaOpen, setCaptchaOpen] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);
    const captchaRef = useRef(null);

    const handleContinueWithoutAccount = () => {
        setCaptchaOpen(true);
    };

    const handleCaptchaClose = () => {
        setCaptchaOpen(false);
        setCaptchaToken(null);
        captchaRef.current?.reset();
    };

    const handleCaptchaConfirm = async () => {
        if (!captchaToken) return;
        handleCaptchaClose();
        try {
            await loginAnonymously();
            navigate("/app");
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            navigate("/app");
        } catch {
            setError(t("login.error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            minHeight="100vh"
            px={3}
            pt={8}
            pb={5}
            sx={styles.page}>
            <FormCard
                id="login-form"
                onSubmit={handleSubmit}
                title={t("login.title")}
                error={error}>
                <TextField
                    placeholder={t("login.email")}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth />
                <TextField
                    placeholder={t("login.password")}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    fullWidth />
            </FormCard>

            <Box flexGrow={1} minHeight={60} />

            <Box width="100%" maxWidth={380} display="flex" flexDirection="column" gap={1.5}>
                <Button
                    type="submit"
                    form="login-form"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={styles.submitButton}>
                    {t("login.submit")}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => navigate("/register")}
                    fullWidth
                    sx={styles.registerButton}>
                    {t("login.register")}
                </Button>
                <Button
                    variant="contained"
                    onClick={handleContinueWithoutAccount}
                    fullWidth
                    sx={styles.anonymousButton}>
                    {t("login.continueWithoutAccount")}
                </Button>
            </Box>

            <Dialog
                open={captchaOpen}
                onClose={handleCaptchaClose}
                sx={captchaStyles.dialog}>
                <DialogTitle sx={captchaStyles.title}>
                    {t("captchaDialog.title")}
                </DialogTitle>
                <DialogContent sx={captchaStyles.content}>
                    <ReCAPTCHA
                        ref={captchaRef}
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={(token) => setCaptchaToken(token)}
                        onExpired={() => setCaptchaToken(null)} />
                </DialogContent>
                <DialogActions sx={captchaStyles.actions}>
                    <Button
                        variant="outlined"
                        onClick={handleCaptchaClose}
                        sx={captchaStyles.cancelButton}>
                        {t("captchaDialog.cancel")}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCaptchaConfirm}
                        disabled={!captchaToken}
                        sx={captchaStyles.confirmButton}>
                        {t("captchaDialog.confirm")}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Login;
