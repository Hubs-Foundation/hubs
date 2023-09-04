import React, { useCallback, useEffect, useState } from "react";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as AgentIcon } from "../icons/User.svg";
import { FormattedMessage, defineMessage, useIntl } from "react-intl";
import { anyEntityWith } from "../../utils/bit-utils";
import { Agent } from "../../bit-components";
import { ToolTip } from "@mozilla/lilypad-ui";
import { virtualAgent } from "../../bit-systems/agent-system";
import { floorMap } from "../../bit-systems/map-system";

const AgentTooltipDescription = defineMessage({
  id: "agent-tooltip.description",
  defaultMessage: "Toggle Agent Visibility"
});

export function AgenSpawnButton({ scene }) {
  const [active, setActive] = useState(true);
  const intl = useIntl();
  const description = intl.formatMessage(AgentTooltipDescription);

  const clickCallback = () => {
    scene.emit("agent-toggle");
    setActive(!virtualAgent.hidden);
  };

  useEffect(() => {
    const toggleMapFunc = event => {
      if (floorMap.eid) {
        clickCallback();
      }
    };

    if (active) {
      window.addEventListener("map-toggle", toggleMapFunc);
    } else {
      console.log("remove event listener");
      window.removeEventListener("map-toggle", toggleMapFunc);
    }

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      console.log("component unmounted, removing event listener");
      window.removeEventListener("map-toggle", toggleMapFunc);
    };
  }, [active]);

  // if (active && floorMap.eid) {
  //   console.log("i listen for map");
  // }

  return (
    <ToolTip description={description}>
      <ToolbarButton
        // Ignore type lint error as we will be redoing ToolbarButton in the future
        // @ts-ignore
        onClick={clickCallback}
        selected={active}
        icon={<AgentIcon />}
        preset="accent5"
        label={<FormattedMessage id="agent-toolbar-button" defaultMessage="Agent" />}
      />
    </ToolTip>
  );
}
