import React from "react";
import PropTypes from "prop-types";

import configs from "../../utils/configs";
import { getAppLogo } from "../../utils/get-app-logo";
import { ReactComponent as HmcLogo } from "../icons/HmcLogo.svg";
import { isHmc } from "../../utils/isHmc";

export function AppLogo({ className, forceConfigurableLogo }) {
  if (isHmc() && !forceConfigurableLogo) {
    return <HmcLogo className="hmc-logo" />;
  } else {
    return <img className={className} alt={configs.translation("app-name")} src={getAppLogo()} />;
  }
}

AppLogo.propTypes = {
  className: PropTypes.string,
  forceConfigurableLogo: PropTypes.bool
};
