import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        dashboard: "Dashboard",
        games: "Games",
        revenue: "Revenue Tracker",
        planning: "Planning",
        users: "Users",
        logout: "Logout",
      },
      dashboard: {
        title: "Overview",
        totalCcu: "Total CCU",
        totalRevenue: "Daily Revenue",
        totalGames: "Active Games",
        monthlyEstimate: "Monthly Estimate",
      },
      common: {
        loading: "Loading...",
        error: "An error occurred.",
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        create: "Create",
        robux: "R$",
        eur: "€",
      },
      cookie: {
        message: "We use cookies to ensure you get the best experience on our dashboard.",
        accept: "Accept",
      }
    }
  },
  fr: {
    translation: {
      nav: {
        dashboard: "Tableau de Bord",
        games: "Jeux",
        revenue: "Suivi des Revenus",
        planning: "Planification",
        users: "Utilisateurs",
        logout: "Se Déconnecter",
      },
      dashboard: {
        title: "Aperçu",
        totalCcu: "CCU Total",
        totalRevenue: "Revenu Quotidien",
        totalGames: "Jeux Actifs",
        monthlyEstimate: "Estimation Mensuelle",
      },
      common: {
        loading: "Chargement...",
        error: "Une erreur est survenue.",
        save: "Enregistrer",
        cancel: "Annuler",
        delete: "Supprimer",
        edit: "Modifier",
        create: "Créer",
        robux: "R$",
        eur: "€",
      },
      cookie: {
        message: "Nous utilisons des cookies pour vous garantir la meilleure expérience sur notre tableau de bord.",
        accept: "Accepter",
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
