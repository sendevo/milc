import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline } from "@mui/material";
import { AuthProvider } from "./contexts/AuthContext";
import "./i18n";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <CssBaseline />
      <App />
    </AuthProvider>
  </React.StrictMode>
);
