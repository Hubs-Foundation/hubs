import React, { forwardRef } from "react";
import { ReactComponent as AvatarIcon } from "../icons/Avatar.svg";
import { ToolbarButton } from "../input/ToolbarButton";
import { FormattedMessage } from "react-intl";

export function ChangeAvatarToolbarButton(props) {
  return (
    <ToolbarButton
      {...props}
      icon={<AvatarIcon />}
      preset="accent5"
      label={<FormattedMessage id="avatar-toolbar-button" defaultMessage="Avatar Change" />}
    />
  );
}
