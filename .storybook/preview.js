import React, { useEffect } from "react";
import { useAccessibleOutlineStyle } from "../src/react-components/input/useAccessibleOutlineStyle";
import "../src/react-components/styles/global.scss";
import { WrappedIntlProvider } from "../src/react-components/wrapped-intl-provider";
import { MINIMAL_VIEWPORTS } from "@storybook/addon-viewport";
import { AVAILABLE_LOCALES } from "../src/assets/locales/locale_config";
import { setLocale } from "../src/utils/i18n";

const Layout = ({ children, locale }) => {
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
    <Layout locale={context.globals.locale}>
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

export const globalTypes = {
  locale: {
    name: "Locale",
    description: "Active locale",
    defaultValue: "browser",
    toolbar: {
      icon: "globe",
      items: locales
    }
  }
};
