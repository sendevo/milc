import { Navigate } from "react-router-dom";
import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { protectedRouteStyles as styles } from "../theme/ProtectedRoute.styles";

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const { t } = useTranslation();

    if (loading) return <Typography sx={styles.loading}>{t("common.loading")}</Typography>;
    if (!currentUser) return <Navigate to="/login" replace />;
    return children;
};

export default ProtectedRoute;
