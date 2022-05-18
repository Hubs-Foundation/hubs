import React from "react";
import PropTypes from "prop-types";
import configs from "../../utils/configs";
import { ExitedRoomScreen } from "./ExitedRoomScreen";

export function ExitedRoomScreenContainer({ reason }) {
  return (
    <ExitedRoomScreen
      showTerms={configs.feature("show_terms")}
      termsUrl={configs.link("terms_of_use", "https://github.com/mozilla/hubs/blob/master/TERMS.md")}
      showSourceLink={configs.feature("show_source_link")}
      reason={reason}
      contactEmail={configs.translation("contact-email")}
    />
  );
}

ExitedRoomScreenContainer.propTypes = {
  reason: PropTypes.string.isRequired
};
