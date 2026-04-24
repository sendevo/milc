import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Typography } from "@mui/material";
import { useAuth } from "./contexts/AuthContext";
import { useTranslation } from "react-i18next";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MainMenu from "./pages/MainMenu";

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) return <Typography sx={{ p: 4 }}>{t("common.loading")}</Typography>;
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainMenu />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
