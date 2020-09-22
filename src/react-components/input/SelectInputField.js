import React from "react";
import PropTypes from "prop-types";
import { InputField } from "./InputField";
import classNames from "classnames";
import styles from "./SelectInputField.scss";
import { ReactComponent as CaretDownIcon } from "../icons/CaretDown.svg";
import { useSelect } from "downshift";

function getSelectedItem(value, options) {
  if (options.length > 0 && typeof options[0] === "object") {
    return options.find(item => item.value === value);
  }

  return value;
}

function getItemId(item) {
  return typeof item === "object" ? item.value : item;
}

function getItemLabel(item) {
  return typeof item === "object" ? item.label || item.value : item;
}

function getItemValue(item) {
  return typeof item === "object" ? item.value : item;
}

export function SelectInputField({
  className,
  error,
  description,
  inputClassName,
  label,
  onChange,
  value,
  options,
  ...rest
}) {
  const {
    isOpen,
    selectedItem,
    getToggleButtonProps,
    getMenuProps,
    getLabelProps,
    highlightedIndex,
    getItemProps
  } = useSelect({
    items: options,
    selectedItem: getSelectedItem(value, options),
    ...rest,
    onSelectedItemChange: ({ selectedItem }) => {
      if (onChange) {
        onChange(getItemValue(selectedItem));
      }
    }
  });

  const selectedItemLabel = getItemLabel(selectedItem);

  return (
    <InputField {...getLabelProps()} className={className} label={label} error={error} description={description}>
      <div className={classNames(styles.selectInput, { [styles.open]: isOpen }, inputClassName)}>
        <button className={styles.dropdownButton} type="button" {...getToggleButtonProps()}>
          <span>{selectedItemLabel !== undefined ? selectedItemLabel : "Select..."}</span>
          <CaretDownIcon />
        </button>
        {options.length > 0 && (
          <ul {...getMenuProps()} className={styles.dropdown}>
            {isOpen &&
              options.map((item, index) => (
                <li
                  className={classNames(styles.dropdownItem, { [styles.highlightedItem]: highlightedIndex === index })}
                  key={getItemId(item)}
                  {...getItemProps({ item, index })}
                >
                  {getItemLabel(item)}
                </li>
              ))}
          </ul>
        )}
      </div>
    </InputField>
  );
}

SelectInputField.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.node,
  description: PropTypes.node,
  labelClassName: PropTypes.string,
  inputClassName: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string,
        value: PropTypes.any.isRequired
      })
    ])
  ).isRequired,
  onChange: PropTypes.func
};

SelectInputField.defaultProps = {
  options: []
};
