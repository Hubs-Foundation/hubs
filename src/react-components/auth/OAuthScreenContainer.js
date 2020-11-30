import React from "react";
import PropTypes from "prop-types";
import configs from "../../utils/configs";
import { OAuthScreen } from "./OAuthScreen";

export function OAuthScreenContainer({ oauthInfo }) {
  const { url, type } = oauthInfo[0];

  return (
    <OAuthScreen
      style={{ backgroundImage: configs.image("home_background", true) }}
      provider={type}
      redirectUrl={url}
      showTerms={configs.feature("show_terms")}
      termsUrl={configs.link("terms_of_use", "https://github.com/mozilla/hubs/blob/master/TERMS.md")}
      showPrivacy={configs.feature("show_privacy")}
      privacyUrl={configs.link("privacy_notice", "https://github.com/mozilla/hubs/blob/master/PRIVACY.md")}
    />
  );
}

OAuthScreenContainer.propTypes = {
  oauthInfo: PropTypes.array
};
