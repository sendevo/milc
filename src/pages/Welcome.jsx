import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import whiteGoat from "../assets/icons/white_goat.png";
import { useAuth } from "../contexts/AuthContext";

const Welcome = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    navigate(currentUser ? "/app" : "/login");
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="space-between"
      minHeight="100vh"
      sx={{
        background: "linear-gradient(160deg, #1a8090 0%, #2dc5a2 100%)",
        px: 5,
        pt: 10,
        pb: 6,
      }}
    >
      {/* Top: title + subtitle + logo */}
      <Box display="flex" flexDirection="column" alignItems="flex-start" gap={2} width="100%">
        <Typography
          variant="h3"
          fontWeight={900}
          color="#ffffff"
          textTransform="uppercase"
          textAlign="left"
        >
          {t("welcome.title")}
        </Typography>
        <Typography
          variant="h6"
          color="rgba(255,255,255,0.9)"
          fontWeight={"bold"}
          lineHeight={"1.2em"}
          marginTop="1em"
          fontSize={32}
          textAlign="left"
        >
          {t("welcome.subtitle")}
        </Typography>
        <Box display="flex" justifyContent="flex-end" width="100%">
          <Box
            component="img"
            src={whiteGoat}
            alt="MILC goat logo"
            sx={{ width: 120, height: 120, objectFit: "contain", mt: 2 }}
          />
        </Box>
      </Box>

      {/* Bottom: button */}
      <Box width="100%" maxWidth={380}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleStart}
          sx={{
            bgcolor: "#ffffff",
            color: "#333333",
            fontWeight: 700,
            boxShadow: "0px 6px 18px rgba(0,0,0,0.35)",
            "&:hover": { bgcolor: "#f0f0f0" },
          }}
        >
          {t("welcome.start")}
        </Button>
      </Box>
    </Box>
  );
};

export default Welcome;
