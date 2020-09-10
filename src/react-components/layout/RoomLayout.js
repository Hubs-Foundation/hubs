import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./RoomLayout.scss";
import { Toolbar } from "./Toolbar";

export function RoomLayout({
  className,
  viewportCanvasRef,
  viewportClassName,
  sidebar,
  sidebarClassName,
  toolbarLeft,
  toolbarCenter,
  toolbarRight,
  toolbarClassName,
  modal,
  ...rest
}) {
  return (
    <div className={classNames(styles.roomLayout, className)} {...rest}>
      <canvas className={classNames(styles.main, styles.viewport, viewportClassName)} ref={viewportCanvasRef} />
      <Toolbar
        className={classNames(styles.main, styles.toolbar, toolbarClassName)}
        left={toolbarLeft}
        center={toolbarCenter}
        right={toolbarRight}
      />
      {sidebar && <div className={classNames(styles.sidebar, sidebarClassName)}>{sidebar}</div>}
      <div className={classNames(styles.modalContainer, styles.viewport)}>{modal}</div>
    </div>
  );
}

RoomLayout.propTypes = {
  className: PropTypes.string,
  viewportCanvasRef: PropTypes.object,
  viewportClassName: PropTypes.string,
  sidebar: PropTypes.node,
  sidebarClassName: PropTypes.string,
  toolbarLeft: PropTypes.node,
  toolbarCenter: PropTypes.node,
  toolbarRight: PropTypes.node,
  toolbarClassName: PropTypes.string,
  modal: PropTypes.node
};
