import React from "react";
import { FormattedMessage } from "react-intl";
import PropTypes from "prop-types";

import { AudioContext } from "../AudioContext";

const AutoExitWarning = props => (
  <AudioContext.Consumer>
    {audio => (
      <div className="autoexit-panel">
        <div className="autoexit-panel__title">
          <FormattedMessage id="autoexit.title" />
          <span>{props.secondsRemaining}</span>
          <FormattedMessage id="autoexit.title_units" />
        </div>
        <div className="autoexit-panel__subtitle">
          <FormattedMessage id="autoexit.subtitle" />
        </div>
        <div
          className="autoexit-panel__cancel-button"
          onClick={props.onCancel}
          onMouseEnter={audio.onMouseEnter}
          onMouseLeave={audio.onMouseLeave}
        >
          <FormattedMessage id="autoexit.cancel" />
        </div>
      </div>
    )}
  </AudioContext.Consumer>
);

AutoExitWarning.propTypes = {
  secondsRemaining: PropTypes.number,
  onCancel: PropTypes.func
};

export default AutoExitWarning;
