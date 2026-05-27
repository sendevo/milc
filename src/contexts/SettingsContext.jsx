import { createContext, useContext, useEffect, useState } from "react";
import i18n from "../i18n";
import { getItem, removeItem, setItem } from "../utils/persistentStorage";

const SettingsContext = createContext(null);

const STORAGE_KEY_LANG = "milc_language";
const STORAGE_KEY_THEME = "milc_theme";
const STORAGE_KEY_SIMULATED_DATE = "milc_simulated_date";

export const SettingsProvider = ({ children }) => {
    const [language, setLanguageState] = useState(() => i18n.language || "es");
    const [themeMode, setThemeModeState] = useState("light");
    const [simulatedDate, setSimulatedDateState] = useState(() => {
        if (!import.meta.env.DEV) {
            return "";
        }
        return "";
    });

    useEffect(() => {
        let isMounted = true;

        const hydrateSettings = async () => {
            const [storedLang, storedTheme, storedDate] = await Promise.all([
                getItem(STORAGE_KEY_LANG),
                getItem(STORAGE_KEY_THEME),
                import.meta.env.DEV ? getItem(STORAGE_KEY_SIMULATED_DATE) : Promise.resolve("")
            ]);

            if (!isMounted) return;

            const lang = storedLang || i18n.language || "es";
            const mode = storedTheme || "light";

            setLanguageState(lang);
            setThemeModeState(mode);
            if (import.meta.env.DEV) {
                setSimulatedDateState(storedDate || "");
            }

            if (lang !== i18n.language) {
                i18n.changeLanguage(lang);
            }
        };

        hydrateSettings();

        return () => {
            isMounted = false;
        };
    }, []);

    const setLanguage = (lang) => {
        i18n.changeLanguage(lang);
        void setItem(STORAGE_KEY_LANG, lang);
        setLanguageState(lang);
    };

    const setThemeMode = (mode) => {
        void setItem(STORAGE_KEY_THEME, mode);
        setThemeModeState(mode);
    };

    const setSimulatedDate = (date) => {
        if (!import.meta.env.DEV) {
            return;
        }
        if (date) {
            void setItem(STORAGE_KEY_SIMULATED_DATE, date);
        } else {
            void removeItem(STORAGE_KEY_SIMULATED_DATE);
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
