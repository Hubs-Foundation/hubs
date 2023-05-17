import { ToolbarButton } from "../../../input/ToolbarButton";
// TO DO: look into changing icon theme handling to work with TS
// @ts-ignore
import { ReactComponent as AgentIcon } from "../../../icons/Avatar.svg";
import { FormattedMessage, defineMessage, useIntl } from "react-intl";
import React, { useContext } from "react";
import { ChatContext } from "../../contexts/ChatContext";
import { ToolTip } from "@mozilla/lilypad-ui";

const AgentTooltipDescription = defineMessage({
    id: "agent-tooltip.description",
    defaultMessage: "Toggle Agent Visibility"
  });

type AgentToolbarButtonProps = {
    onClick: () => void;
  };

const AgentToolbarButton = ({ onClick }: AgentToolbarButtonProps) => {
  
    const intl = useIntl();
    const description = intl.formatMessage(AgentTooltipDescription);
  
    return (
      <ToolTip description={description}>
        <ToolbarButton
          // Ignore type lint error as we will be redoing ToolbarButton in the future
          // @ts-ignore
          onClick={onClick}
          icon={<AgentIcon />}
          preset="accent4"
          label={<FormattedMessage id="agent-toolbar-button" defaultMessage="Agent" />}
        />
      </ToolTip>
    );
  };

  export default AgentToolbarButton;