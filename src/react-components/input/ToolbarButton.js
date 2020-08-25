import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./ToolbarButton.scss";

export const presets = ["basic", "transparent", "accept", "cancel", "red", "orange", "green", "blue", "purple"];

export const ToolbarButton = forwardRef(({ preset, className, icon, label, selected, ...rest }, ref) => {
  return (
    <button
      ref={ref}
      className={classNames(styles.toolbarButton, styles[preset], { [styles.selected]: selected }, className)}
      {...rest}
    >
      <div className={styles.iconContainer} aria-hidden="true">
        {icon}
      </div>
      <label>{label}</label>
    </button>
  );
});

ToolbarButton.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string,
  selected: PropTypes.bool,
  preset: PropTypes.oneOf(presets),
  className: PropTypes.string
};

ToolbarButton.defaultProps = {
  preset: "basic"
};
