import React from "react";
import "./BackClose.scss";
import arrowIcon from "../../assets/images/arrow-icon.png";
import closeIcon from "../../assets/images/close-icon.png";
import classNames from "classnames";

export const GoBack = ({ ...rest }) => {
  return (
    <>
      <span className="btn-next circle-btn" onClick={onClick} {...rest}>
        <img src={arrowIcon} />
      </span>
    </>
  );
};
export const Close = ({ className, onClick, ...rest }) => {
  return (
    <>
      <span className={classNames("btn-close circle-btn", className)} onClick={onClick} {...rest}>
        <img src={closeIcon} />
      </span>
    </>
  );
};
