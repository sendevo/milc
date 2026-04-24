import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";

export default function Welcome() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={3}
    >
      <Typography variant="h3">{t("welcome.title")}</Typography>
      <Button variant="contained" size="large" onClick={() => navigate("/login")}>
        {t("welcome.start")}
      </Button>
    </Box>
  );
}
