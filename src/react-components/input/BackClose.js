import React from "react";
import "./BackClose.scss";
import arrowIcon from "../../assets/images/arrow-icon.png";
import closeIcon from "../../assets/images/close-icon.png";

export const GoBack = ({ ...rest }) => {
  return (
    <>
      <span className="btn-next circle-btn" {...rest}>
        <img src={arrowIcon} />
      </span>
    </>
  );
};
export const Close = ({ ...rest }) => {
  return (
    <>
      <span className="btn-close circle-btn" {...rest}>
        <img src={closeIcon} />
      </span>
    </>
  );
};
