import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Container.scss";

export function Container({ as: Component, children, className, ...rest }) {
  return (
    <Component className={classNames(styles.container, className)} {...rest}>
      {children}
    </Component>
  );
}

Container.defaultProps = {
  as: "section"
};

Container.propTypes = {
  as: PropTypes.elementType,
  children: PropTypes.node,
  className: PropTypes.string
};
