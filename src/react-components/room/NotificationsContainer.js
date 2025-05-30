import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./NotificationsContainer.scss";

// In Storybook/testing environments, AFRAME may not be available
// Default to desktop behavior for component previews
const isMobile = (typeof AFRAME !== "undefined" && AFRAME.utils?.device?.isMobile?.()) || false;

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
