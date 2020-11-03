import React from "react";
import { IconButton } from "../input/IconButton";
import { ReactComponent as CloseIcon } from "../icons/Close.svg";

export function CloseButton(props) {
  return (
    <IconButton {...props}>
      <CloseIcon width={16} height={16} />
    </IconButton>
  );
}
