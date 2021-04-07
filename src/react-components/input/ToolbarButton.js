import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./ToolbarButton.scss";

export const presets = [
  "basic",
  "transparent",
  "accept",
  "cancel",
  "accent1",
  "accent2",
  "accent3",
  "accent4",
  "accent5"
];

export const statusColors = ["recording", "unread", "enabled", "disabled"];

export const ToolbarButton = forwardRef(
  (
    { preset, className, iconContainerClassName, children, icon, label, selected, large, statusColor, ...rest },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={classNames(
          styles.toolbarButton,
          styles[preset],
          { [styles.selected]: selected, [styles.large]: large },
          className
        )}
        {...rest}
      >
        <div className={classNames(styles.iconContainer, iconContainerClassName)} aria-hidden="true">
          {icon}
          {statusColor && <div className={classNames(styles.statusIndicator, styles["status-" + statusColor])} />}
          {children}
        </div>
        <label>{label}</label>
      </button>
    );
  }
);

ToolbarButton.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.node,
  selected: PropTypes.bool,
  preset: PropTypes.oneOf(presets),
  statusColor: PropTypes.oneOf(statusColors),
  large: PropTypes.bool,
  className: PropTypes.string,
  iconContainerClassName: PropTypes.string,
  children: PropTypes.node
};

ToolbarButton.defaultProps = {
  preset: "basic"
};
