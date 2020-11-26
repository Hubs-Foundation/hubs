import React from "react";
import PropTypes from "prop-types";
import { Button } from "./Button.js";
import { FormattedMessage } from "react-intl";

export function MessageButton(props) {
  return (
    <Button {...props}>
      <FormattedMessage id={props.id} />
    </Button>
  );
}

MessageButton.propTypes = {
  id: PropTypes.string
};
