import React from "react";
import PropTypes from "prop-types";
import configs from "../../utils/configs";
import { getMessages } from "../../utils/i18n";
import { ExitedRoomScreen } from "./ExitedRoomScreen";

export function ExitedRoomScreenContainer({ reason }) {
  const contactEmail = getMessages()["contact-email"];

  return (
    <ExitedRoomScreen
      showTerms={configs.feature("show_terms")}
      termsUrl={configs.link("terms_of_use", "https://github.com/mozilla/hubs/blob/master/TERMS.md")}
      logoSrc={configs.image("logo")}
      showSourceLink={configs.feature("show_source_link")}
      reason={reason}
      contactEmail={contactEmail}
    />
  );
}

ExitedRoomScreenContainer.propTypes = {
  reason: PropTypes.string.isRequired
};
