import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ToastProvider } from "./contexts/ToastContext";
import "./i18n";
import App from "./App";
import { initPersistentStorage } from "./utils/persistentStorage";

async function bootstrap() {
    await initPersistentStorage();

    ReactDOM.createRoot(document.getElementById("root")).render(
        <React.StrictMode>
            <SettingsProvider>
                <ToastProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </ToastProvider>
            </SettingsProvider>
        </React.StrictMode>
    );
}

bootstrap();
