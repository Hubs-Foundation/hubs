import React from "react";
import PropTypes from "prop-types";

import configs from "../../utils/configs";
import { ReactComponent as HmcLogo } from "../icons/HmcLogo.svg";
import { isHmc } from "../../utils/isHmc";
import { useDarkMode } from "../styles/theme";

export function AppLogo({ className, forceConfigurableLogo }) {
  const darkMode = useDarkMode();
  if (isHmc() && !forceConfigurableLogo) {
    return <HmcLogo className="hmc-logo" />;
  } else {
    return (
      <img
        className={className}
        alt={configs.translation("app-name")}
        src={(darkMode && configs.image("logo_dark")) || configs.image("logo")}
      />
    );
  }
}

AppLogo.propTypes = {
  className: PropTypes.string,
  forceConfigurableLogo: PropTypes.bool
};
