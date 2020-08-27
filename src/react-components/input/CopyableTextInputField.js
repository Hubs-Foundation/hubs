import React from "react";
import PropTypes from "prop-types";
import { useClipboard } from "use-clipboard-copy";
import { TextInputField } from "./TextInputField";
import { Button } from "./Button";
import styles from "./CopyableTextInputField.scss";

export function CopyableTextInputField({ buttonPreset, copiedLabel, copyLabel, ...rest }) {
  const clipboard = useClipboard({
    copiedTimeout: 600
  });

  // Use a dynamic width based on the content to account for i18n
  const maxLabelLength = Math.max(copyLabel.length, copiedLabel.length);

  return (
    <TextInputField
      ref={clipboard.target}
      afterInput={
        clipboard.isSupported() ? (
          <Button
            preset={buttonPreset}
            onClick={clipboard.copy}
            className={styles.copyButton}
            style={{ width: `${maxLabelLength}ch` }} // ch is a unit representing the width of the 0 character
          >
            {clipboard.copied ? copiedLabel : copyLabel}
          </Button>
        ) : (
          undefined
        )
      }
      {...rest}
    />
  );
}

CopyableTextInputField.propTypes = {
  copyLabel: PropTypes.string,
  copiedLabel: PropTypes.string,
  buttonPreset: PropTypes.string
};

CopyableTextInputField.defaultProps = {
  copyLabel: "Copy",
  copiedLabel: "Copied"
};
