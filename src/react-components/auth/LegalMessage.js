import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";

export function LegalMessage({ termsUrl, privacyUrl }) {
  const toslink = useCallback(
    chunks => (
      <a rel="noopener noreferrer" target="_blank" href={termsUrl}>
        {chunks}
      </a>
    ),
    [termsUrl]
  );

  const privacylink = useCallback(
    chunks => (
      <a rel="noopener noreferrer" target="_blank" href={privacyUrl}>
        {chunks}
      </a>
    ),
    [privacyUrl]
  );

  if (termsUrl && privacyUrl) {
    return (
      <FormattedMessage
        id="legal-message.tos-and-privacy"
        defaultMessage="By proceeding, you agree to the <toslink>terms of use</toslink> and <privacylink>privacy notice</privacylink>."
        values={{
          toslink,
          privacylink
        }}
      />
    );
  }

  if (termsUrl && !privacyUrl) {
    return (
      <FormattedMessage
        id="legal-message.tos"
        defaultMessage="By proceeding, you agree to the <toslink>terms of use</toslink>."
        values={{
          toslink
        }}
      />
    );
  }

  if (!termsUrl && privacyUrl) {
    return (
      <FormattedMessage
        id="legal-message.privacy"
        defaultMessage="By proceeding, you agree to the <privacylink>privacy notice</privacylink>."
        values={{
          privacylink
        }}
      />
    );
  }

  return null;
}

LegalMessage.propTypes = {
  termsUrl: PropTypes.string,
  privacyUrl: PropTypes.string
};
