import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      welcome: {
        title: "MILC APP",
        subtitle: "Your guide to healthy goat milk",
        start: "Start",
      },
      login: {
        title: "Login",
        email: "Email",
        password: "Password",
        submit: "Login",
        error: "Login failed. Please check your credentials.",
        register: "Create an account",
        continueWithoutAccount: "Continue without account",
      },
      register: {
        title: "Register",
        name: "Name",
        place: "Location",
        healthCard: "Health Card (Carnet Sanitario)",
        confirmPassword: "Confirm Password",
        submit: "Create Account",
        error: "Registration failed. Please try again.",
        passwordMismatch: "Passwords do not match.",
        backToLogin: "Back to Login",
      },
      mainMenu: {
        title: "Control Panel",
        panelTitle: "Control Panel",
        myDay: "My Day",
        moreActions: "More Actions",
        beforeMilking: "Before Milking",
        duringMilking: "During Milking",
        milkCare: "Milk Care",
        health: "Health",
        food: "Food",
        facilities: "Facilities",
        mySupplies: "My Supplies",
        pests: "Pests & Rodents",
        myRecords: "My Records",
        myAccount: "My Account",
        myProfile: "My Profile",
        settings: "Settings",
        logout: "Logout",
        info: "Information & Help",
        createAccount: "Create Account",
      },
      common: {
        loading: "Loading...",
      },
    },
  },
  es: {
    translation: {
      welcome: {
        title: "MILC APP",
        subtitle: "Tu guía para una leche saludable de cabra",
        start: "Comenzar",
      },
      login: {
        title: "Iniciar sesión",
        email: "Correo electrónico",
        password: "Contraseña",
        submit: "Ingresar",
        error: "Error al iniciar sesión. Verifica tus credenciales.",
        register: "Crear una cuenta",
        continueWithoutAccount: "Continuar sin cuenta",
      },
      register: {
        title: "Registrarse",
        name: "Nombre",
        place: "Lugar",
        healthCard: "Carnet Sanitario",
        confirmPassword: "Confirmar contraseña",
        submit: "Crear cuenta",
        error: "Error al registrarse. Inténtalo de nuevo.",
        passwordMismatch: "Las contraseñas no coinciden.",
        backToLogin: "Volver al inicio de sesión",
      },
      mainMenu: {
        title: "Panel de Control",
        panelTitle: "Panel de Control",
        myDay: "Mi Día",
        moreActions: "Más Acciones",
        beforeMilking: "Antes de ordeñar",
        duringMilking: "Durante el ordeño",
        milkCare: "Cuidado de la leche",
        health: "Salud",
        food: "Alimento",
        facilities: "Instalaciones",
        mySupplies: "Mis insumos",
        pests: "Plagas y roedores",
        myRecords: "Mis registros",
        myAccount: "Mi cuenta",
        myProfile: "Mi perfil",
        settings: "Configuración",
        logout: "Cerrar sesión",
        info: "Información y ayuda",
        createAccount: "Crear cuenta",
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
