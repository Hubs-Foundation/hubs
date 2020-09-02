import React from "react";
import PropTypes from "prop-types";
import { InputField } from "./InputField";
import classNames from "classnames";
import styles from "./SelectInputField.scss";
import { ReactComponent as CaretDownIcon } from "../icons/CaretDown.svg";
import { useSelect } from "downshift";

export function SelectInputField({ className, error, description, inputClassName, label, onChange, items, ...rest }) {
  const {
    isOpen,
    selectedItem,
    getToggleButtonProps,
    getMenuProps,
    getLabelProps,
    highlightedIndex,
    getItemProps
  } = useSelect({
    items,
    ...rest,
    onSelectedItemChange: onChange
  });

  return (
    <InputField {...getLabelProps()} className={className} label={label} error={error} description={description}>
      <div className={classNames(styles.selectInput, { [styles.open]: isOpen }, inputClassName)}>
        <button className={styles.dropdownButton} type="button" {...getToggleButtonProps()}>
          <span>{selectedItem ? selectedItem.label : "Select..."}</span>
          <CaretDownIcon />
        </button>
        <ul {...getMenuProps()} className={styles.dropdown}>
          {isOpen &&
            items.map((item, index) => (
              <li
                className={classNames(styles.dropdownItem, { [styles.highlightedItem]: highlightedIndex === index })}
                key={item.id}
                {...getItemProps({ item, index })}
              >
                {item.label}
              </li>
            ))}
        </ul>
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
  items: PropTypes.array.isRequired,
  onChange: PropTypes.func
};

SelectInputField.defaultProps = {
  items: []
};
