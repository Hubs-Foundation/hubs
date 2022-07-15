import React from "react";
import className from "classnames";
import PropTypes from "prop-types";
import styles from "./ReactionButton.scss";
import { ReactComponent as HandRaisedIcon } from "../icons/HandRaised.svg";
import { FormattedMessage } from "react-intl";

export function ReactionButton({ active, children, ...props }) {
  return (
    <button className={className(styles.reactionButton, { [styles.active]: active })} {...props}>
      {children}
    </button>
  );
}

ReactionButton.propTypes = {
  children: PropTypes.node,
  active: PropTypes.bool
};

export function HandRaisedButton({ active, ...props }) {
  return (
    <ReactionButton active={active} {...props}>
      <HandRaisedIcon width="42px" height="42px" />
      <p>
        {active ? (
          <FormattedMessage id="reaction-popover.lower-hand" defaultMessage="Lower Hand" />
        ) : (
          <FormattedMessage id="reaction-popover.raise-hand" defaultMessage="Raise Hand" />
        )}
      </p>
    </ReactionButton>
  );
}

HandRaisedButton.propTypes = {
  active: PropTypes.bool
};
