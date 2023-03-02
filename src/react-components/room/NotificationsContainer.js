import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./NotificationsContainer.scss";

const isMobile = AFRAME.utils.device.isMobile();

export function NotificationsContainer({ className, children, ...rest }) {
  return (
    <div className={classNames(className, styles.content, isMobile && styles.mobile)} {...rest}>
      {children}
    </div>
  );
}

NotificationsContainer.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};
