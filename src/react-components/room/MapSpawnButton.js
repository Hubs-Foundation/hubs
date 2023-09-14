import React, { useCallback, useEffect, useState } from "react";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as AgentIcon } from "../icons/Map.svg";
import { FormattedMessage, defineMessage, useIntl } from "react-intl";
import { anyEntityWith } from "../../utils/bit-utils";
import { Agent } from "../../bit-components";
import { ToolTip } from "@mozilla/lilypad-ui";
import { virtualAgent } from "../../bit-systems/agent-system";

const MapTooltipDescription = defineMessage({
  id: "map-tooltip.description",
  defaultMessage: "Toggle Map"
});

export function MapSpawnButton({ scene }) {
  const [active, setActive] = useState(false);
  const intl = useIntl();
  const description = intl.formatMessage(MapTooltipDescription);

  const clickCallback = () => {
    scene.emit("map-toggle");
  };

  const activateButton = () => {
    setActive(scene.is("map"));
  };

  window.addEventListener("map-toggle", activateButton);

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

// Ignore type lint error as we will be redoing ToolbarButton in the future
// @ts-ignore
