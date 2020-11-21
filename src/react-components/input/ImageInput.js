import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./ImageInput.scss";
import { ReactComponent as UploadIcon } from "../icons/Upload.svg";

export const ImageInput = forwardRef(({ className, thumbnailUrl, label, ...rest }, ref) => {
  return (
    <label className={classNames(styles.imageInput, className)}>
      <div className={styles.thumbnailContainer}>
        {thumbnailUrl ? <img src={thumbnailUrl} alt={label} /> : <UploadIcon />}
      </div>
      <small>{label}</small>
      <input className={styles.input} type="file" {...rest} ref={ref} />
    </label>
  );
});

ImageInput.propTypes = {
  className: PropTypes.string,
  thumbnailUrl: PropTypes.string,
  label: PropTypes.node
};
