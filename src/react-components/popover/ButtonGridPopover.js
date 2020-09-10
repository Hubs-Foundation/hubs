import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { ToolbarButton } from "../input/ToolbarButton";
import styles from "./ButtonGridPopover.scss";

export function ButtonGridPopover({ fullscreen, items, onSelect }) {
  return (
    <div className={classNames(styles.buttonGridPopover, { [styles.fullscreen]: fullscreen })}>
      {items.map(item => {
        const Icon = item.icon;
        return (
          <ToolbarButton
            key={item.id}
            icon={<Icon />}
            preset={item.color}
            onClick={() => onSelect(item)}
            label={item.label}
          />
        );
      })}
    </div>
  );
}

ButtonGridPopover.propTypes = {
  fullscreen: PropTypes.bool,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      color: PropTypes.string,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired
};
