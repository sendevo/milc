import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider } from "./contexts/AuthContext";
import theme from "./theme";
import "./i18n";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <AuthProvider>
                <CssBaseline />
                <App />
            </AuthProvider>
    </ThemeProvider>
    </React.StrictMode>
);
