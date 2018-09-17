import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import DialogContainer from "./dialog-container.js";

class AuthDialog extends Component {
  static propTypes = {
    intl: PropTypes.object,
    verifying: PropTypes.bool,
    authOrigin: PropTypes.string
  };

  render() {
    const { authOrigin, verifying } = this.props;
    const { formatMessage } = this.props.intl;
    const title = verifying ? formatMessage({ id: "auth.verifying" }) : formatMessage({ id: "auth.verified-title" });

    return (
      <DialogContainer title={title} {...this.props}>
        {verifying ? (
          <FormattedMessage id="auth.verifying" />
        ) : authOrigin === "spoke" ? (
          <FormattedMessage id="auth.spoke-verified" values={{ br: <br /> }} />
        ) : (
          <FormattedMessage id="auth.verified" />
        )}
      </DialogContainer>
    );
  }
}

export default injectIntl(AuthDialog);
