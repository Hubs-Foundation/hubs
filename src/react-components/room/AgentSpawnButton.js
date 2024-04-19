import React, { useCallback, useEffect, useState } from "react";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as AgentIcon } from "../icons/User.svg";
import { FormattedMessage, defineMessage, useIntl } from "react-intl";
import { ToolTip } from "@mozilla/lilypad-ui";
import { virtualAgent } from "../../bit-systems/agent-system";
import { roomPropertiesReader } from "../../utils/rooms-properties";

const AgentTooltipDescription = defineMessage({
  id: "agent-tooltip.description",
  defaultMessage: "Toggle Agent Visibility"
});

export function AgenSpawnButton({ scene }) {
  if (roomPropertiesReader.AllowsAgent) {
    const [active, setActive] = useState(false);
    const intl = useIntl();
    const description = intl.formatMessage(AgentTooltipDescription);

    const clickCallback = () => {
      scene.emit("agent-toggle");
      // scene.emit("toggle_translation");
    };

    const activateButton = () => {
      setActive(scene.is("agent"));
    };

    window.addEventListener("agent-toggle", activateButton);
    window.addEventListener("clear-scene", activateButton);

    return (
      <ToolTip description={description}>
        <ToolbarButton
          onClick={clickCallback}
          selected={active}
          icon={<AgentIcon />}
          preset="accent5"
          label={<FormattedMessage id="agent-toolbar-button" defaultMessage="Agent" />}
        />
      </ToolTip>
    );
  }

  return null;
}
