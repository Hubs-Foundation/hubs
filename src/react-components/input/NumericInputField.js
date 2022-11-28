import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import { InputField } from "./InputField";
import { useId } from "./useId";
import { NumericInput } from "./NumericInput";

/* eslint-disable-next-line react/display-name */
export const NumericInputField = memo(
  forwardRef(({ className, error, description, inputClassName, label, fullWidth, ...rest }, ref) => {
    const id = useId();
    const labelId = useId();

    return (
      <InputField
        id={labelId}
        htmlFor={id}
        className={className}
        label={label}
        error={error}
        description={description}
        fullWidth={fullWidth}
      >
        <NumericInput id={id} ref={ref} className={inputClassName} {...rest} />
      </InputField>
    );
  })
);

NumericInputField.propTypes = {
  className: PropTypes.string,
  label: PropTypes.node,
  error: PropTypes.node,
  description: PropTypes.node,
  labelClassName: PropTypes.string,
  inputClassName: PropTypes.string,
  fullWidth: PropTypes.bool
};
