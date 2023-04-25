import { ToolbarButton } from "../../../input/ToolbarButton";
// TO DO: look into changing icon theme handling to work with TS
// @ts-ignore
import { ReactComponent as ChatIcon } from "../../../icons/Chat.svg";
import { FormattedMessage } from "react-intl";
import React, { RefAttributes, useContext } from "react";
import { ChatContext } from "../../contexts/ChatContext";
import { ToolTip } from "@mozilla/lilypad-ui";

interface ChatToolbarButtonProps extends RefAttributes<any> {
  onClick: () => void;
}

const ChatToolbarButton = ({ onClick }: ChatToolbarButtonProps) => {
  const { unreadMessages } = useContext(ChatContext);

  return (
    <ToolTip description="Open chat sidebar">
      <ToolbarButton
        // Ignore type lint error as we will be redoing ToolbarButton in the future
        // @ts-ignore
        onClick={onClick}
        statusColor={unreadMessages ? "unread" : undefined}
        icon={<ChatIcon />}
        preset="accent4"
        label={<FormattedMessage id="chat-toolbar-button" defaultMessage="Chat" />}
      />
    </ToolTip>
  );
};

export default ChatToolbarButton;
