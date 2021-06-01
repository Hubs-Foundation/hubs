import React from "react";
import PropTypes from "prop-types";
import { Center } from "./Center";
import classNames from "classnames";
import styles from "./CenteredModalWrapper.scss";

export const CenteredModalWrapper = ({ children }) => (
  <div className={classNames(styles.fullscreen, styles.darken)}>
    <Center>{children}</Center>
  </div>
);

CenteredModalWrapper.propTypes = {
  children: PropTypes.node
};
