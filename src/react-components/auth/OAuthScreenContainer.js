import React from "react";
import PropTypes from "prop-types";
import configs from "../../utils/configs";
import { OAuthScreen } from "./OAuthScreen";
import { TERMS, PRIVACY } from "../../constants";

export function OAuthScreenContainer({ oauthInfo }) {
  const { url, type } = oauthInfo[0];

  return (
    <OAuthScreen
      provider={type}
      redirectUrl={url}
      termsUrl={configs.feature("show_terms") && configs.link("terms_of_use", TERMS)}
      privacyUrl={configs.feature("show_privacy") && configs.link("privacy_notice", PRIVACY)}
    />
  );
}

OAuthScreenContainer.propTypes = {
  oauthInfo: PropTypes.array
};
