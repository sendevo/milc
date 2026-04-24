import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";

export default function MainMenu() {
  const { t } = useTranslation();

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <Typography variant="h4">{t("mainMenu.title")}</Typography>
    </Box>
  );
}
