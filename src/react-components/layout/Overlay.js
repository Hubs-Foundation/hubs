import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Overlay.scss";

export function Overlay({ active, children, className, ...rest }) {
  const overlayClassNames = classNames(
    styles.overlay,
    {
      [styles.active]: active
    },
    className
  );

  return (
    <div className={overlayClassNames} {...rest}>
      {children}
    </div>
  );
}

Overlay.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string
};
