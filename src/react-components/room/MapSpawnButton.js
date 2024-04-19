import React, { useCallback, useEffect, useState } from "react";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as AgentIcon } from "../icons/Map.svg";
import { FormattedMessage, defineMessage, useIntl } from "react-intl";
import { anyEntityWith } from "../../utils/bit-utils";
import { Agent } from "../../bit-components";
import { ToolTip } from "@mozilla/lilypad-ui";
import { virtualAgent } from "../../bit-systems/agent-system";
import { roomPropertiesReader } from "../../utils/rooms-properties";

const MapTooltipDescription = defineMessage({
  id: "map-tooltip.description",
  defaultMessage: "Toggle Map"
});

export function MapSpawnButton({ scene }) {
  if (roomPropertiesReader.AllowsMap) {
    console.log(`button is working`);
    const [active, setActive] = useState(false);
    const intl = useIntl();
    const description = intl.formatMessage(MapTooltipDescription);

    const clickCallback = () => {
      scene.emit("map-toggle");
      console.log(`button is emitting`);
    };

    const activateButton = () => {
      setActive(scene.is("map"));
    };

    window.addEventListener("map-toggle", activateButton);
    window.addEventListener("clear-scene", activateButton);

    return (
      <ToolTip description={description}>
        <ToolbarButton
          onClick={clickCallback}
          selected={active}
          icon={<AgentIcon />}
          preset="accent5"
          label={<FormattedMessage id="map-toolbar-button" defaultMessage="Map" />}
        />
      </ToolTip>
    );
  }

  return null;
}

// Ignore type lint error as we will be redoing ToolbarButton in the future
// @ts-ignore
