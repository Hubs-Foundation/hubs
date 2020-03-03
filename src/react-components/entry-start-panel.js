import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import LobbyChatBox from "./lobby-chat-box.js";

// this component is currently just being used for its componentDidMount
// TODO migrate render from ui-root.js renderEntryStartPanel()
export default class EntryStartPanel extends Component {
  componentDidMount() {
    if (this.props.entering) {
      this.props.onEnteringCanceled();
    }
  }

  render() {
    return null;
  }
}
