import React from "react";
import { ToolbarButton } from "../input/ToolbarButton";
import { FormattedMessage } from "react-intl";
import { ReactComponent as ScreenCaptureIcon } from "../icons/ScreenCapture.svg";

export const TakeScreenCapture = props => {
  return (
    <ToolbarButton
      preset="accent1"
      icon={<ScreenCaptureIcon />}
      label={<FormattedMessage id="take-screencapture.label" defaultMessage="Screen Capture" />}
      onClick={props.onClick}
    />
  );
};
