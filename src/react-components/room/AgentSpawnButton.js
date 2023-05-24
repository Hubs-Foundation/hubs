import React, { useCallback, useEffect, useState } from "react";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as AgentIcon } from "../icons/Avatar.svg";
import { FormattedMessage, defineMessage, useIntl } from "react-intl";
import { anyEntityWith } from "../../utils/bit-utils";
import { Agent } from "../../bit-components";
import { ToolTip } from "@mozilla/lilypad-ui";

const AgentTooltipDescription = defineMessage({
    id: "agent-tooltip.description",
    defaultMessage: "Toggle Agent Visibility"
});

export function AgenSpawnButton({scene}){
    const [flag, setFlag] = useState(false);
    const intl = useIntl();
    const description = intl.formatMessage(AgentTooltipDescription);    

    const clickCallback = ()=> {
        scene.emit("agent-toggle");
        setFlag(!!anyEntityWith(APP.world, Agent));
      }

    scene.addEventListener("agent-removed", () => setFlag(false));
    scene.addEventListener("agent-spawned", () => setFlag(true));

    return (
        <ToolTip description={description}>
          <ToolbarButton
            // Ignore type lint error as we will be redoing ToolbarButton in the future
            // @ts-ignore
            onClick={clickCallback}
            selected={flag}
            icon={<AgentIcon />}
            preset="accent5"
            label={<FormattedMessage id="agent-toolbar-button" defaultMessage="Agent" />}
            
          />
        </ToolTip>
    );
};