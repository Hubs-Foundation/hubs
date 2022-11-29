import React from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/presence-log.scss";
import { permissionMessage } from "./room/PermissionNotifications";
import { useIntl } from "react-intl";

export default function PermissionMessage({ body: { status, permission }, className, isMod }) {
  const intl = useIntl();
  const message = permissionMessage({ status, permission, isMod }, intl);
  return (
    <div className={className}>
      <div className={styles.permissionBody}>{message}</div>
    </div>
  );
}

PermissionMessage.propTypes = {
  name: PropTypes.string,
  body: PropTypes.object,
  className: PropTypes.string,
  isMod: PropTypes.bool
};
