import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./ToolbarButton.scss";

export const presets = ["basic", "accept", "cancel", "red", "orange", "green", "blue", "purple"];

export function ToolbarButton({ preset, className, icon, label, selected, ...rest }) {
  return (
    <button
      className={classNames(styles.toolbarButton, styles[preset], { [styles.selected]: selected }, className)}
      {...rest}
    >
      <div className={styles.iconContainer}>{icon}</div>
      <label>{label}</label>
    </button>
  );
}

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
