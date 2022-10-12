import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./ImageGridPopover.scss";

export function ImageGridPopover({ fullscreen, items, closePopover }) {
  return (
    <div className={classNames(styles.imageGridPopover, { [styles.fullscreen]: fullscreen })}>
      {items.map(item => {
        return (
          <img
            key={item.id}
            // crossOrigin: "anonymous" is a workaround for CORS error on Chrome. See #4400
            crossOrigin="anonymous"
            src={item.src}
            alt={item.label}
            onClick={() => {
              if (item.onSelect) {
                item.onSelect(item);
              }

              closePopover();
            }}
          />
        );
      })}
    </div>
  );
}

ImageGridPopover.propTypes = {
  fullscreen: PropTypes.bool,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      src: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      onSelect: PropTypes.func
    })
  ).isRequired,
  closePopover: PropTypes.func.isRequired
};
