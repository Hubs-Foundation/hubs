import React, { memo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Slider.scss";

function getLinearGradientCSS(ratio, leftColor, rightColor) {
  return [
    "-webkit-gradient(",
    "linear, ",
    "left top, ",
    "right top, ",
    "color-stop(" + ratio + ", " + leftColor + "), ",
    "color-stop(" + ratio + ", " + rightColor + ")",
    ")"
  ].join("");
}

function updateGradient(el, min, max) {
  if (el) {
    const ratio = ((parseFloat(el.value) - min) / (max - min)).toFixed(2);
    el.style.backgroundImage = getLinearGradientCSS(ratio, styles.trackColor, "transparent");
  }
}

/* eslint-disable-next-line react/display-name */
export const Slider = memo(({ min, max, step, value, onChange, disabled, className, ...rest }) => {
  const inputRef = useRef();

  useEffect(() => {
    updateGradient(inputRef.current, min, max);
  });

  return (
    <div className={classNames(styles.numberWithRange, className)}>
      <div className={classNames(styles.rangeSlider)} disabled={disabled}>
        <input
          ref={inputRef}
          type="range"
          step={step}
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={e => {
            value === undefined && updateGradient(inputRef.current, min, max);
            if (onChange) {
              onChange(parseFloat(e.target.value));
            }
          }}
          {...rest}
        />
      </div>
    </div>
  );
});

Slider.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  value: PropTypes.number,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  className: PropTypes.string
};

Slider.defaultProps = {
  min: 0,
  max: 100,
  step: 1,
  disabled: false
};
