import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import DialogContainer from "./dialog-container.js";
import IfFeature from "./if-feature";

class AuthDialog extends Component {
  static propTypes = {
    intl: PropTypes.object,
    verifying: PropTypes.bool,
    verified: PropTypes.bool,
    authOrigin: PropTypes.string
  };

  render() {
    const { authOrigin, verifying, verified } = this.props;
    const { formatMessage } = this.props.intl;
    const title = verifying || !verified ? "" : formatMessage({ id: "auth.verified-title" });

    if (!verifying && !verified) {
      return (
        <DialogContainer title={title} closable={true} {...this.props}>
          <FormattedMessage className="preformatted" id="auth.verify-failed" />
        </DialogContainer>
      );
    } else {
      return (
        <DialogContainer title={title} closable={!verifying} {...this.props}>
          {verifying ? (
            <div className="loader-wrap loader-mid">
              <div className="loader">
                <div className="loader-center" />
              </div>
            </div>
          ) : authOrigin === "spoke" ? (
            <FormattedMessage className="preformatted" id="auth.spoke-verified" />
          ) : (
            <div>
              <FormattedMessage className="preformatted" id="auth.verified" />
              <IfFeature name="show_newsletter_signup">
                <p>
                  Want Hubs news sent to your inbox?{"\n"}
                  <a href="https://eepurl.com/gX_fH9" target="_blank" rel="noopener noreferrer">
                    Subscribe for updates
                  </a>.
                </p>
              </IfFeature>
            </div>
          )}
        </DialogContainer>
      );
    }
  }
}

export default injectIntl(AuthDialog);
