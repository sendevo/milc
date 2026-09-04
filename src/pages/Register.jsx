import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, TextField } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import FormCard from "../components/FormCard";
import ViewContainer from "../components/ViewContainer";
import { registerLoginStyles as styles } from "../theme/RegisterLogin.styles";

const Register = () => {
    const { t } = useTranslation();
    const { register, saveUserProfile } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [place, setPlace] = useState("");
    const [healthCard, setHealthCard] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError(t("register.passwordMismatch"));
        }
        setError("");
        setLoading(true);
        try {
            const { user } = await register(email, password);
            await saveUserProfile(user.uid, { name, place, healthCard, email });
            navigate("/home");
        } catch {
            setError(t("register.error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewContainer title={t("register.title")}>
            <Box sx={styles.page}>
                <FormCard
                    sx={styles.formCard}
                    id="register-form"
                    onSubmit={handleSubmit}
                    title={t("register.subtitle")}
                    error={error}>
                    <TextField
                        placeholder={t("register.name")}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        fullWidth />
                    <TextField
                        placeholder={t("register.place")}
                        type="text"
                        value={place}
                        onChange={(e) => setPlace(e.target.value)}
                        required
                        fullWidth />
                    <TextField
                        placeholder={t("register.healthCard")}
                        type="text"
                        value={healthCard}
                        onChange={(e) => setHealthCard(e.target.value)}
                        required
                        fullWidth />
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
                    <TextField
                        placeholder={t("register.confirmPassword")}
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        fullWidth />
                </FormCard>

                <Box sx={styles.buttonContainer}>
                    <Button
                        type="submit"
                        form="register-form"
                        variant="contained"
                        fullWidth
                        disabled={loading}
                        sx={styles.submitButton}>
                        {t("register.submit")}
                    </Button>
                    <Button
                        variant="text"
                        onClick={() => navigate("/login")}
                        fullWidth
                        sx={styles.backToLoginButton}>
                        {t("register.backToLogin")}
                    </Button>
                </Box>
            </Box>
        </ViewContainer>
    );
};

export default Register;
