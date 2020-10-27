import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./NumericInput.scss";
import { TextInput } from "./TextInput";
import { ReactComponent as CaretUpIcon } from "../icons/CaretUp.svg";
import { ReactComponent as CaretDownIcon } from "../icons/CaretDown.svg";

export const NumericInput = memo(
  forwardRef(({ className, afterInput, disabled, value, onChange, ...rest }, ref) => {
    return (
      <TextInput
        inputmode="numeric"
        {...rest}
        type="number"
        className={classNames(styles.numericInput, className)}
        ref={ref}
        disabled={disabled}
        value={value}
        onChange={onChange}
        afterInput={
          <>
            <div className={styles.numericButtons}>
              <button className={styles.numericButton} disabled={disabled} onClick={() => onChange(value + 1)}>
                <CaretUpIcon width={10} height={10} />
              </button>
              <button className={styles.numericButton} disabled={disabled} onClick={() => onChange(value - 1)}>
                <CaretDownIcon width={10} height={10} />
              </button>
            </div>
            {afterInput}
          </>
        }
      />
    );
  })
);

NumericInput.propTypes = {
  afterInput: PropTypes.node,
  className: PropTypes.string
};
