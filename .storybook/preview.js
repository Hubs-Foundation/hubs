import React, { useEffect } from "react";
import { useAccessibleOutlineStyle } from "../src/react-components/input/useAccessibleOutlineStyle";
import { WrappedIntlProvider } from "../src/react-components/wrapped-intl-provider";
import { MINIMAL_VIEWPORTS } from "@storybook/addon-viewport";
import { AVAILABLE_LOCALES } from "../src/assets/locales/locale_config";
import { setLocale } from "../src/utils/i18n";
import { themes } from "../src/utils/theme";
import { useTheme } from "../src/react-components/styles/theme";
import "../src/react-components/styles/global.scss";

const Layout = ({ children, locale, theme }) => {
  useTheme(theme);

  useAccessibleOutlineStyle();

  useEffect(
    () => {
      setLocale(locale);
    },
    [locale]
  );

  return <WrappedIntlProvider>{children}</WrappedIntlProvider>;
};

export const decorators = [
  (Story, context) => (
    <Layout locale={context.globals.locale} theme={context.globals.theme}>
      <Story />
    </Layout>
  )
];

export const parameters = {
  viewport: {
    viewports: {
      ...MINIMAL_VIEWPORTS,
      oculusQuest: {
        name: "Oculus Quest",
        styles: {
          width: "800px",
          height: "450px"
        }
      }
    }
  }
};

const locales = Object.entries(AVAILABLE_LOCALES).map(([value, title]) => ({ title, value }));
locales.unshift({ title: "Browser Default", value: "browser" });

const themeOptions = themes.map(({ id, name }) => ({ title: name, value: id }));
themeOptions.unshift({ title: "Browser Default", value: null });

export const globalTypes = {
  locale: {
    name: "Locale",
    description: "Active locale",
    defaultValue: "browser",
    toolbar: {
      icon: "globe",
      items: locales
    }
  },
  theme: {
    name: "Theme",
    description: "Active theme",
    defaultValue: null,
    toolbar: {
      icon: "globe",
      items: themeOptions
    }
  }
};
