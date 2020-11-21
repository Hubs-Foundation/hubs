import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./AvatarRadioInput.scss";

export const AvatarRadioInput = forwardRef(({ className, label, thumbnailUrl, ...rest }, ref) => (
  <label className={classNames(styles.avatarRadioInput, className)}>
    <input className={styles.input} {...rest} type="radio" ref={ref} />
    <img className={styles.thumbnail} src={thumbnailUrl} alt={label} />
    <small className={styles.label}>{label}</small>
  </label>
));

AvatarRadioInput.propTypes = {
  className: PropTypes.string,
  label: PropTypes.node,
  thumbnailUrl: PropTypes.string
};
