import React from "react";
import PropTypes from "prop-types";
import styles from "./Row.scss";
import styleUtils from "../styles/style-utils.scss";
import classNames from "classnames";

export const Row = ({
  children,
  padding,
  gap,
  spaceBetween,
  breakpointColumn,
  topMargin,
  flexClassName,
  flexBasis,
  className
}) => {
  const paddingClass = padding === true ? styleUtils.lgPadding : styleUtils[`${padding}Padding`];
  const gapClass = gap === true ? styleUtils.mdGap : styleUtils[`${gap}Gap`];
  const breakpointColumnClass = breakpointColumn === true ? "" : styles[`${breakpointColumn}BreakpointColumn`];
  const topMarginClass = topMargin ? styleUtils[`${topMargin}WrapMargin`] : "";
  const flexBasisClass = flexBasis ? styleUtils[`flexBasis${flexBasis}`] : "";

  return (
    <div className={classNames(paddingClass, gapClass, className)}>
      <div
        className={classNames(
          styles.flexRow,
          breakpointColumnClass,
          topMarginClass,
          {
            [styles.spaceBetween]: spaceBetween
          },
          flexClassName,
          flexBasisClass
        )}
      >
        {children}
      </div>
    </div>
  );
};

Row.propTypes = {
  children: PropTypes.node,
  padding: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  gap: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  topMargin: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  breakpointColumn: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  spaceBetween: PropTypes.bool,
  className: PropTypes.string,
  flexClassName: PropTypes.string,
  flexBasis: PropTypes.oneOf([10, 20, 30, 40, 50, 60, 70, 80, 90])
};
