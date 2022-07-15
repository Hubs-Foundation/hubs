import React from "react";
import PropTypes from "prop-types";
import configs from "../../utils/configs";
import { ExitedRoomScreen } from "./ExitedRoomScreen";
import constants from "../../constants";

export function ExitedRoomScreenContainer({ reason }) {
  return (
    <ExitedRoomScreen
      showTerms={configs.feature("show_terms")}
      termsUrl={configs.link("terms_of_use", constants.TERMS)}
      showSourceLink={configs.feature("show_source_link")}
      reason={reason}
      contactEmail={configs.translation("contact-email")}
    />
  );
}

ExitedRoomScreenContainer.propTypes = {
  reason: PropTypes.string.isRequired
};
