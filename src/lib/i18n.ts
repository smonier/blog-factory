import type { RenderContext } from "org.jahia.services.render";

// Import locale files
import enLocale from "../../settings/locales/en.json";
import frLocale from "../../settings/locales/fr.json";
import esLocale from "../../settings/locales/es.json";
import deLocale from "../../settings/locales/de.json";

type LocaleMessages = Record<string, string>;

const locales: Record<string, LocaleMessages> = {
  en: enLocale as LocaleMessages,
  fr: frLocale as LocaleMessages,
  es: esLocale as LocaleMessages,
  de: deLocale as LocaleMessages,
};

/**
 * Get the current locale from the render context
 */
export const getLocale = (renderContext?: RenderContext): string => {
  try {
    if (renderContext && typeof renderContext.getMainResourceLocale === "function") {
      const locale = renderContext.getMainResourceLocale();
      if (locale && typeof locale.getLanguage === "function") {
        const lang = locale.getLanguage();
        if (lang && typeof lang === "string") {
          return lang.toLowerCase();
        }
      }
    }
  } catch (error) {
    console.warn("[i18n] Unable to get locale from renderContext:", error);
  }
  return "en"; // Default to English
};

/**
 * Get a translated message
 */
export const getMessage = (key: string, locale: string = "en", defaultValue?: string): string => {
  const messages = locales[locale] || locales.en;
  return messages[key] || defaultValue || key;
};

/**
 * Get a translated message from render context
 */
export const getMessageFromContext = (
  key: string,
  renderContext?: RenderContext,
  defaultValue?: string,
): string => {
  const locale = getLocale(renderContext);
  return getMessage(key, locale, defaultValue);
};
