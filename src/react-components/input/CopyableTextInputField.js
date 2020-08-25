import React from "react";
import PropTypes from "prop-types";
import { useClipboard } from "use-clipboard-copy";
import { TextInputField } from "./TextInputField";
import { Button } from "./Button";

export function CopyableTextInputField({ buttonPreset, ...rest }) {
  const clipboard = useClipboard({
    copiedTimeout: 600
  });

  return (
    <TextInputField
      ref={clipboard.target}
      afterInput={
        clipboard.isSupported() ? (
          <Button preset={buttonPreset} onClick={clipboard.copy}>
            {clipboard.copied ? "Copied" : "Copy"}
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
  buttonPreset: PropTypes.string
};
