import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import { InputField } from "./InputField";
import { RadioInput } from "./RadioInput";
import { useId } from "./useId";

export const RadioInputField = memo(
  forwardRef(({ className, error, description, inputClassName, label, ...rest }, ref) => {
    const id = useId();
    const labelId = useId();

    return (
      <InputField id={labelId} htmlFor={id} className={className} label={label} error={error} description={description}>
        <RadioInput id={id} ref={ref} className={inputClassName} {...rest} />
      </InputField>
    );
  })
);

RadioInputField.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.node,
  description: PropTypes.node,
  labelClassName: PropTypes.string,
  inputClassName: PropTypes.string
};
