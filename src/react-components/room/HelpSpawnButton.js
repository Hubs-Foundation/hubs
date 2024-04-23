import React, { useCallback, useEffect, useState } from "react";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as AgentIcon } from "../icons/Help.svg";
import { FormattedMessage, defineMessage, useIntl } from "react-intl";
import { ToolTip } from "@mozilla/lilypad-ui";
import { roomPropertiesReader } from "../../utils/rooms-properties";

const HelpTooltipDescription = defineMessage({
  id: "help-tooltip.description",
  defaultMessage: "Toggle Help"
});

export function HelpSpawnButton({ scene }) {
  const [active, setActive] = useState(false);
  const intl = useIntl();
  const description = intl.formatMessage(HelpTooltipDescription);

  const clickCallback = () => {
    scene.emit("help-toggle");
  };

  const activateButton = () => {
    setActive(scene.is("help"));
  };

  window.addEventListener("help-toggle", activateButton);
  window.addEventListener("clear-scene", activateButton);

  return (
    <ToolTip description={description}>
      <ToolbarButton
        onClick={clickCallback}
        selected={active}
        icon={<AgentIcon />}
        preset="accent5"
        label={<FormattedMessage id="help-tooltip.button" defaultMessage="Help" />}
      />
    </ToolTip>
  );

  return null;
}

// Ignore type lint error as we will be redoing ToolbarButton in the future
// @ts-ignore
