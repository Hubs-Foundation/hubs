import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./RadioInput.scss";

export function RadioInput({ options, value, onChange }) {
  return (
    <div className={classNames(styles.radioInput)}>
      {options.map(option => (
        <label key={option.id} className={styles.option}>
          <input
            className={styles.input}
            type="radio"
            value={option.value}
            checked={option.value === value}
            onChange={onChange}
          />
          <div className={styles.content}>
            <span className={styles.label}>{option.label}</span>
            {option.description && <span className={styles.description}>{option.description}</span>}
          </div>
        </label>
      ))}
    </div>
  );
}

RadioInput.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func
};
