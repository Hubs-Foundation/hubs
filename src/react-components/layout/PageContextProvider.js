import React from "react";
import PropTypes from "prop-types";
import { IntlProvider } from "react-intl";
import { DialogProvider } from "./dialog-context";
import { lang, messages } from "../../utils/i18n";

export function PageContextProvider({ children }) {
  return (
    <IntlProvider locale={lang} messages={messages}>
      <DialogProvider>{children}</DialogProvider>
    </IntlProvider>
  );
}

PageContextProvider.propTypes = {
  children: PropTypes.node
};
