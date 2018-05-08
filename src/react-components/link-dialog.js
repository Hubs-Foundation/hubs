import React, { Component } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";

class LinkDialog extends Component {
  state = {
    code: null
  };

  static propTypes = {
    linkChannel: PropTypes.object,
    onLinkCodeUsed: PropTypes.func
  };

  render() {
    return <div>Hello</div>;
  }
}

export default LinkDialog;
