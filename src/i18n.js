import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      welcome: {
        title: "Welcome",
        start: "Start",
      },
      login: {
        title: "Login",
        email: "Email",
        password: "Password",
        submit: "Login",
        error: "Login failed. Please check your credentials.",
      },
      mainMenu: {
        title: "Main Menu",
      },
      common: {
        loading: "Loading...",
      },
    },
  },
  es: {
    translation: {
      welcome: {
        title: "Bienvenido",
        start: "Comenzar",
      },
      login: {
        title: "Iniciar sesión",
        email: "Correo electrónico",
        password: "Contraseña",
        submit: "Ingresar",
        error: "Error al iniciar sesión. Verifica tus credenciales.",
      },
      mainMenu: {
        title: "Menú principal",
      },
      common: {
        loading: "Cargando...",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
