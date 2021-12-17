import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef } from "react";
import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Slider.scss";
import { trackColor } from "./Slider.scss";

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

function updateGradient(el, min, max, value) {
  if (el) {
    const ratio = ((value - min) / (max - min)).toFixed(2);
    el.style.backgroundImage = getLinearGradientCSS(ratio, trackColor, "transparent");
  }
}

export const Slider = memo(
  forwardRef(({ min, max, step, defaultValue, onChange, disabled, className, ...rest }, ref) => {
    const inputRef = useRef();
    const [displayValue, setDisplayValue] = useState(defaultValue);

    const updateValue = useCallback(
      value => {
        setDisplayValue(value);
        updateGradient(inputRef.current, min, max, value);
      },
      [inputRef, min, max, setDisplayValue]
    );

    useImperativeHandle(ref, () => ({
      setValue: value => {
        updateValue(value);
      }
    }));

    useEffect(
      () => {
        updateValue(displayValue);
      },
      [updateValue, displayValue]
    );

    return (
      <div className={classNames(styles.numberWithRange, className)}>
        <div className={classNames(styles.rangeSlider)} disabled={disabled}>
          <input
            ref={inputRef}
            type="range"
            step={step}
            min={min}
            max={max}
            value={displayValue}
            disabled={disabled}
            onChange={e => {
              if (disabled) return;
              const value = parseFloat(e.target.value);
              updateValue(value);
              if (onChange) {
                onChange(value);
              }
            }}
            {...rest}
          />
        </div>
      </div>
    );
  })
);

Slider.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  defaultValue: PropTypes.number,
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
