import React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Slider.scss";
import { trackColor } from "./Slider.scss";

function round(step, n) {
  return Math.round(n / step) * step;
}

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

export function Slider({ min, max, step, digits, value, defaultValue, onChange, disabled, className }) {
  const myRoot = useRef();
  const inputRef = useRef();
  const [displayValue, setDisplayValue] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);

  let currentValue = defaultValue;
  if (isDragging) {
    currentValue = displayValue !== -1 ? displayValue : defaultValue;
  } else {
    currentValue = value !== undefined ? value : displayValue !== -1 ? displayValue : defaultValue;
  }

  const stopDragging = useCallback(
    () => {
      setIsDragging(false);
    },
    [setIsDragging]
  );

  const onUpdateValue = useCallback(
    v => {
      setDisplayValue(v);
      if (onChange) {
        onChange(v);
      }
    },
    [onChange, setDisplayValue]
  );

  const drag = useCallback(
    e => {
      if (!isDragging) return;
      const viewportOffset = myRoot.current.getBoundingClientRect();
      const t = Math.max(0, Math.min((e.clientX - viewportOffset.left) / viewportOffset.width, 1));
      const num = round(step, min + t * (max - min));
      onUpdateValue(num);
    },
    [isDragging, step, min, max, onUpdateValue]
  );

  useEffect(
    () => {
      window.addEventListener("mouseup", stopDragging);
      window.addEventListener("mousemove", drag);

      updateGradient(inputRef.current, min, max, currentValue);

      return () => {
        window.removeEventListener("mouseup", stopDragging);
        window.removeEventListener("mousemove", drag);
      };
    },
    [drag, stopDragging, inputRef, min, max, currentValue]
  );

  return (
    <div className={classNames(styles.numberWithRange, className)}>
      <div
        ref={myRoot}
        className={classNames(styles.rangeSlider)}
        disabled={disabled}
        onMouseDown={e => {
          e.preventDefault();
          if (disabled) return;
          setIsDragging(true);
          const viewportOffset = myRoot.current.getBoundingClientRect();
          const t = Math.max(0, Math.min((e.clientX - viewportOffset.left) / viewportOffset.width, 1));
          const num = round(step, min + t * (max - min));
          const finalNum = parseFloat(num.toFixed(digits));
          onUpdateValue(finalNum);
        }}
      >
        <input
          ref={inputRef}
          type="range"
          step={step}
          min={min}
          max={max}
          value={currentValue}
          disabled={disabled}
          onChange={e => {
            if (disabled) return;
            const num = round(step, parseFloat(e.target.value));
            const finalNum = parseFloat(num.toFixed(digits));
            onUpdateValue(finalNum);
          }}
        />
      </div>
    </div>
  );
}

Slider.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  digits: PropTypes.number,
  value: PropTypes.number,
  defaultValue: PropTypes.number,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  className: PropTypes.string
};

Slider.defaultProps = {
  min: 0,
  max: 100,
  step: 1,
  digits: 0,
  currentValue: 50,
  disabled: false
};
