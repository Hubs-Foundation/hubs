import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./RoomLayout.scss";
// ResizeObserver not currently supported in Firefox Android
import ResizeObserver from "resize-observer-polyfill";
import { Toolbar } from "./Toolbar";

export function RoomLayout({
  className,
  viewportClassName,
  sidebar,
  sidebarClassName,
  toolbarLeft,
  toolbarCenter,
  toolbarRight,
  toolbarClassName,
  modal,
  viewport,
  objectFocused,
  streaming,
  onResizeViewport,
  ...rest
}) {
  const viewportRef = useRef();

  useEffect(
    () => {
      let observer = null;

      if (onResizeViewport) {
        observer = new ResizeObserver(entries => {
          onResizeViewport(entries[0].contentRect);
        });
        observer.observe(viewportRef.current);
      }

      return () => {
        if (observer) {
          observer.disconnect();
        }
      };
    },
    [onResizeViewport]
  );

  return (
    <div className={classNames(styles.roomLayout, { [styles.objectFocused]: objectFocused }, className)} {...rest}>
      {sidebar && <div className={classNames(styles.sidebar, sidebarClassName)}>{sidebar}</div>}
      <div className={classNames(styles.modalContainer, styles.viewport)} ref={viewportRef}>
        {modal}
      </div>
      {(toolbarLeft || toolbarCenter || toolbarRight) && (
        <Toolbar
          className={classNames(styles.main, styles.toolbar, toolbarClassName)}
          left={toolbarLeft}
          center={toolbarCenter}
          right={toolbarRight}
        />
      )}
      <div className={classNames(styles.main, styles.viewport, { [styles.streaming]: streaming }, viewportClassName)}>
        {viewport}
      </div>
    </div>
  );
}

RoomLayout.propTypes = {
  className: PropTypes.string,
  viewportClassName: PropTypes.string,
  sidebar: PropTypes.node,
  sidebarClassName: PropTypes.string,
  toolbarLeft: PropTypes.node,
  toolbarCenter: PropTypes.node,
  toolbarRight: PropTypes.node,
  toolbarClassName: PropTypes.string,
  modal: PropTypes.node,
  viewport: PropTypes.node,
  objectFocused: PropTypes.bool,
  streaming: PropTypes.bool,
  onResizeViewport: PropTypes.func
};
