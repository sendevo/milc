import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import "./i18n";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <SettingsProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </SettingsProvider>
    </React.StrictMode>
);
