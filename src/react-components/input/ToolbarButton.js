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

export const types = ["none", "left", "middle", "right"];

export const statusColors = ["recording", "unread", "enabled", "disabled"];

export const ToolbarButton = forwardRef(
  (
    {
      preset,
      className,
      iconContainerClassName,
      children,
      icon,
      label,
      title,
      selected,
      large,
      statusColor,
      type,
      disabled,
      onClick,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={classNames(
          styles.toolbarButton,
          styles[preset],
          styles[type],
          { [styles.selected]: selected, [styles.large]: large },
          className
        )}
        disabled={disabled}
        title={title}
        onClick={onClick}
        {...rest}
      >
        <div
          className={classNames(styles.iconContainer, iconContainerClassName)}
          disabled={disabled}
          aria-hidden="true"
        >
          {icon}
          {statusColor && <div className={classNames(styles.statusIndicator, styles["status-" + statusColor])} />}
          {children}
        </div>
        {label && <label disabled={disabled}>{label}</label>}
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
  className: PropTypes.string,
  iconContainerClassName: PropTypes.string,
  children: PropTypes.node,
  type: PropTypes.oneOf(types),
  large: PropTypes.bool,
  disabled: PropTypes.bool,
  title: PropTypes.node,
  onClick: PropTypes.func
};

ToolbarButton.defaultProps = {
  preset: "basic",
  disabled: false
};

ToolbarButton.displayName = "ToolbarButton";
