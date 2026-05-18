import { createContext, useContext, useEffect, useState } from "react";
import i18n from "../i18n";

const SettingsContext = createContext(null);

const STORAGE_KEY_LANG = "milc_language";
const STORAGE_KEY_THEME = "milc_theme";
const STORAGE_KEY_SIMULATED_DATE = "milc_simulated_date";

export const SettingsProvider = ({ children }) => {
    const [language, setLanguageState] = useState(
        () => localStorage.getItem(STORAGE_KEY_LANG) || i18n.language || "es"
    );
    const [themeMode, setThemeModeState] = useState(
        () => localStorage.getItem(STORAGE_KEY_THEME) || "light"
    );
    const [simulatedDate, setSimulatedDateState] = useState(() => {
        if (!import.meta.env.DEV) {
            return "";
        }
        return localStorage.getItem(STORAGE_KEY_SIMULATED_DATE) || "";
    });

    // Apply the persisted language on first mount so i18n reflects the stored preference.
    useEffect(() => {
        if (language !== i18n.language) {
            i18n.changeLanguage(language);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const setLanguage = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem(STORAGE_KEY_LANG, lang);
        setLanguageState(lang);
    };

    const setThemeMode = (mode) => {
        localStorage.setItem(STORAGE_KEY_THEME, mode);
        setThemeModeState(mode);
    };

    const setSimulatedDate = (date) => {
        if (!import.meta.env.DEV) {
            return;
        }
        if (date) {
            localStorage.setItem(STORAGE_KEY_SIMULATED_DATE, date);
        } else {
            localStorage.removeItem(STORAGE_KEY_SIMULATED_DATE);
        }
        setSimulatedDateState(date || "");
    };

    const getCurrentDateTime = () => {
        const systemNow = new Date();
        if (!import.meta.env.DEV || !simulatedDate) {
            return systemNow;
        }

        const parsed = new Date(`${simulatedDate}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) {
            return systemNow;
        }

        parsed.setHours(
            systemNow.getHours(),
            systemNow.getMinutes(),
            systemNow.getSeconds(),
            systemNow.getMilliseconds()
        );
        return parsed;
    };

    return (
        <SettingsContext.Provider value={{
            language,
            themeMode,
            simulatedDate,
            setLanguage,
            setThemeMode,
            setSimulatedDate,
            getCurrentDateTime,
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
