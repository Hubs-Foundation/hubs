import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Button.scss";
import textInputStyles from "./TextInput.scss";
import { FormattedMessage } from "react-intl";

export const presets = ["transparent", "basic", "accept", "cancel", "red", "orange", "green", "blue", "purple"];

export const Button = memo(
  forwardRef(({ as, sm, preset, className, children, ...rest }, ref) => {
    const ButtonComponent = as;
    const buttonProps = ButtonComponent === "button" ? { type: "button" } : {};

    return (
      <ButtonComponent
        className={classNames(styles.button, textInputStyles.button, styles[preset], { [styles.sm]: sm }, className)}
        {...buttonProps}
        {...rest}
        ref={ref}
      >
        {children}
      </ButtonComponent>
    );
  })
);

Button.propTypes = {
  as: PropTypes.elementType,
  preset: PropTypes.oneOf(presets),
  className: PropTypes.string,
  children: PropTypes.node,
  sm: PropTypes.bool
};

Button.defaultProps = {
  as: "button",
  preset: "basic"
};

export function NextButton(props) {
  return (
    <Button preset="accept" {...props}>
      <FormattedMessage id="button.next" defaultMessage="Next" />
    </Button>
  );
}

export function CancelButton(props) {
  return (
    <Button preset="cancel" {...props}>
      <FormattedMessage id="button.cancel" defaultMessage="Cancel" />
    </Button>
  );
}

export function ContinueButton(props) {
  return (
    <Button preset="accept" {...props}>
      <FormattedMessage id="button.continue" defaultMessage="Continue" />
    </Button>
  );
}
