import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { ToolbarButton } from "../input/ToolbarButton";
import styles from "./ButtonGridPopover.scss";

export function ButtonGridPopover({ fullscreen, items, closePopover }) {
  return (
    <div className={classNames(styles.buttonGridPopover, { [styles.fullscreen]: fullscreen })}>
      {items.map(item => {
        const Icon = item.icon;
        return (
          <ToolbarButton
            key={item.id}
            icon={<Icon />}
            preset={item.color}
            onClick={() => {
              if (item.onSelect) {
                item.onSelect(item);
              }

              closePopover();
            }}
            label={item.label}
            selected={item.selected}
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
      label: PropTypes.element.isRequired,
      onSelect: PropTypes.func
    })
  ).isRequired,
  closePopover: PropTypes.func.isRequired
};
