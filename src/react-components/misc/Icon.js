import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

export const Icon = forwardRef(({ className, icon, ...rest }, ref) => {
  return (
    <div className={classNames(className)} {...rest} ref={ref}>
      {icon}
    </div>
  );
});

Icon.propTypes = {
  icon: PropTypes.node,
  className: PropTypes.string
};
