import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, TextField } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import FormCard from "../components/FormCard";

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
      navigate("/app");
    } catch {
      setError(t("register.error"));
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
      bgcolor="#ffffff"
      px={3}
      pt={8}
      pb={5}
    >
      <FormCard
        id="register-form"
        onSubmit={handleSubmit}
        title={t("register.title")}
        error={error}
      >
        <TextField
          placeholder={t("register.name")}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
        />
        <TextField
          placeholder={t("register.place")}
          type="text"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          required
          fullWidth
        />
        <TextField
          placeholder={t("register.healthCard")}
          type="text"
          value={healthCard}
          onChange={(e) => setHealthCard(e.target.value)}
          required
          fullWidth
        />
        <TextField
          placeholder={t("login.email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
        <TextField
          placeholder={t("login.password")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
        />
        <TextField
          placeholder={t("register.confirmPassword")}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          fullWidth
        />
      </FormCard>

      <Box flexGrow={1} minHeight={60} />

      <Box width="100%" maxWidth={380} display="flex" flexDirection="column" gap={1}>
        <Button
          type="submit"
          form="register-form"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{ bgcolor: "#1a5f70", "&:hover": { bgcolor: "#154f5e" } }}
        >
          {t("register.submit")}
        </Button>
        <Button
          variant="text"
          onClick={() => navigate("/login")}
          fullWidth
          sx={{ color: "#1a8898" }}
        >
          {t("register.backToLogin")}
        </Button>
      </Box>
    </Box>
  );
};

export default Register;
