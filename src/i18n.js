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
        register: "Create an account",
      },
      register: {
        title: "Register",
        confirmPassword: "Confirm Password",
        submit: "Create Account",
        error: "Registration failed. Please try again.",
        passwordMismatch: "Passwords do not match.",
        backToLogin: "Back to Login",
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
        register: "Crear una cuenta",
      },
      register: {
        title: "Registrarse",
        confirmPassword: "Confirmar contraseña",
        submit: "Crear cuenta",
        error: "Error al registrarse. Inténtalo de nuevo.",
        passwordMismatch: "Las contraseñas no coinciden.",
        backToLogin: "Volver al inicio de sesión",
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
  lng: "es",
  fallbackLng: "es",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
