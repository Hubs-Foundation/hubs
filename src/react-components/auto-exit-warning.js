import React from "react";
import { FormattedMessage } from "react-intl";
import PropTypes from "prop-types";

import { WithHoverSound } from "./wrap-with-audio";

const AutoExitWarning = props => (
  <div className="autoexit-panel">
    <div className="autoexit-panel__title">
      <FormattedMessage id="autoexit.title" />
      <span>{props.secondsRemaining}</span>
      <FormattedMessage id="autoexit.title_units" />
    </div>
    <div className="autoexit-panel__subtitle">
      <FormattedMessage id={props.message} />
    </div>
    <WithHoverSound>
      <div className="autoexit-panel__cancel-button" onClick={props.onCancel}>
        <FormattedMessage id="autoexit.cancel" />
      </div>
    </WithHoverSound>
  </div>
);

AutoExitWarning.propTypes = {
  message: PropTypes.string,
  secondsRemaining: PropTypes.number,
  onCancel: PropTypes.func
};

export default AutoExitWarning;
