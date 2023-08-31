import React, { useCallback, useEffect, useState } from "react";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as AgentIcon } from "../icons/Avatar.svg";
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
  const [flag, setFlag] = useState(false);
  const intl = useIntl();
  const description = intl.formatMessage(MapTooltipDescription);

  const clickCallback = () => {
    scene.emit("map-toggle");
  };

  return (
    <ToolTip description={description}>
      <ToolbarButton
        // Ignore type lint error as we will be redoing ToolbarButton in the future
        // @ts-ignore
        onClick={clickCallback}
        selected={flag}
        icon={<AgentIcon />}
        preset="accent5"
        label={<FormattedMessage id="agent-toolbar-button" defaultMessage="Map" />}
      />
    </ToolTip>
  );
}
