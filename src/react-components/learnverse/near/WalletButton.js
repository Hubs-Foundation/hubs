import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { Button } from "../../input/Button";

export function WalletButton({ mobile }) {
  return (
    <Button thick preset="signin" as="a" href="/wallet">
      <FormattedMessage id="sign-in-button" defaultMessage="Connect Wallet" />
    </Button>
  );
}
WalletButton.propTypes = {
  mobile: PropTypes.bool
};
