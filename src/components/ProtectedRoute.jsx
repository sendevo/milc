import { Navigate } from "react-router-dom";
import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) return <Typography sx={{ p: 4 }}>{t("common.loading")}</Typography>;
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
