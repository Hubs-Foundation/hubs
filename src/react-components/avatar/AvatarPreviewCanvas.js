import React, { memo, forwardRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./AvatarPreviewCanvas.scss";

export const AvatarPreviewCanvas = memo(
  forwardRef(({ className, ...rest }, ref) => {
    return <canvas className={classNames(styles.avatarPreviewCanvas, className)} ref={ref} {...rest} />;
  })
);

AvatarPreviewCanvas.propTypes = {
  className: PropTypes.string
};
