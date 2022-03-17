import React from "react";
import PropTypes from "prop-types";
import styles from "./Divider.scss";
import styleUtils from "../styles/style-utils.scss";
import classNames from "classnames";

export const Divider = ({ margin = false }) => {
  const marginClass = margin === false ? "" : styleUtils[`${margin}MarginY`];
  return <div className={classNames(styles.divider, marginClass)} />;
};

Divider.propTypes = {
  margin: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"])
};
