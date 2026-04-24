import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, TextField } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import FormCard from "../components/FormCard";

const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      bgcolor="#ffffff"
      px={3}
      pt={8}
      pb={5}
    >
      <FormCard
        id="login-form"
        onSubmit={handleSubmit}
        title={t("login.title")}
        error={error}
      >
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
      </FormCard>

      <Box flexGrow={1} minHeight={60} />

      <Box width="100%" maxWidth={380} display="flex" flexDirection="column" gap={1}>
        <Button
          type="submit"
          form="login-form"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{ bgcolor: "#1a5f70", "&:hover": { bgcolor: "#154f5e" } }}
        >
          {t("login.submit")}
        </Button>
        <Button
          variant="text"
          onClick={() => navigate("/register")}
          fullWidth
          sx={{ color: "#1a8898" }}
        >
          {t("login.register")}
        </Button>
      </Box>
    </Box>
  );
};

export default Login;
