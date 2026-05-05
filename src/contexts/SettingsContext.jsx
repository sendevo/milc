import { createContext, useContext, useEffect, useState } from "react";
import i18n from "../i18n";

const SettingsContext = createContext(null);

const STORAGE_KEY_LANG = "milc_language";
const STORAGE_KEY_THEME = "milc_theme";

export const SettingsProvider = ({ children }) => {
    const [language, setLanguageState] = useState(
        () => localStorage.getItem(STORAGE_KEY_LANG) || i18n.language || "es"
    );
    const [themeMode, setThemeModeState] = useState(
        () => localStorage.getItem(STORAGE_KEY_THEME) || "light"
    );

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

    return (
        <SettingsContext.Provider value={{ language, themeMode, setLanguage, setThemeMode }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
