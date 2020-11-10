import React, { memo } from "react";
import PropTypes from "prop-types";
import { InputField } from "./InputField";
import { RadioInputContainer, RadioInputOption as _RadioInputOption } from "./RadioInput";

export const RadioInputField = memo(({ className, error, description, inputClassName, label, children, ...rest }) => {
  return (
    <InputField className={className} label={label} error={error} description={description}>
      <RadioInputContainer className={inputClassName} {...rest}>
        {children}
      </RadioInputContainer>
    </InputField>
  );
});

RadioInputField.propTypes = {
  className: PropTypes.string,
  label: PropTypes.node,
  error: PropTypes.node,
  description: PropTypes.node,
  labelClassName: PropTypes.string,
  inputClassName: PropTypes.string,
  children: PropTypes.node
};

export const RadioInputOption = _RadioInputOption;
