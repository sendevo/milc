import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
    Box, 
    Button, 
    Dialog, 
    DialogActions, 
    DialogContent, 
    DialogTitle, 
    TextField 
} from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "../contexts/AuthContext";
import FormCard from "../components/FormCard";
import ViewContainer from "../components/ViewContainer";
import { registerLoginStyles as styles } from "../theme/RegisterLogin.styles";
import { captchaDialogStyles as captchaStyles } from "../theme/CaptchaDialog.styles";
import { RECAPTCHA_SITE_KEY } from "../constants/constants";

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
            navigate("/home");
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
            navigate("/home");
        } catch {
            setError(t("login.error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewContainer title={t("login.title")}>
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
                    sx={styles.formCard}
                    id="login-form"
                    onSubmit={handleSubmit}
                    title={t("login.subtitle")}
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

                <Box sx={styles.buttonContainer}>
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
        </ViewContainer>
    );
};

export default Login;
