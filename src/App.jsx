import { useMemo } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MainMenu from "./pages/MainMenu";
import SurveyPage from "./pages/SurveyPage";
import Config from "./pages/Config";
import Info from "./pages/Info";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { useSettings } from "./contexts/SettingsContext";
import createAppTheme from "./theme";
import './index.css';

const GuestRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    if (loading) return null;
    if (currentUser && !currentUser.isAnonymous) return <Navigate to="/app" replace />;
    return children;
};

const App = () => {
    const { themeMode } = useSettings();
    const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

    return (
        <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app-container">
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                <Route
                    path="/app"
                    element={
                        <ProtectedRoute>
                        <MainMenu />
                        </ProtectedRoute>
                    }/>
                <Route
                    path="/survey/:nodeId"
                    element={
                        <ProtectedRoute>
                        <SurveyPage />
                        </ProtectedRoute>
                    }/>
                <Route
                    path="/config"
                    element={
                        <ProtectedRoute>
                        <Config />
                        </ProtectedRoute>
                    }/>
                <Route
                    path="/info"
                    element={
                        <ProtectedRoute>
                        <Info />
                        </ProtectedRoute>
                    }/>
            </Routes>
            </BrowserRouter>
        </div>
        </ThemeProvider>
    );
};

export default App;
