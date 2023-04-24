import { ToolbarButton } from "../../input/ToolbarButton";
import ChatIcon from "../../icons/Chat.svg";
import { FormattedMessage } from "react-intl";
import React, { useContext } from "react";
import { ChatContext } from "../ChatSidebarContainer";

function ChatToolbarButton(props: any) {
  const { unreadMessages } = useContext(ChatContext);

  return (
    <ToolbarButton
      {...props}
      statusColor={unreadMessages ? "unread" : undefined}
      icon={<ChatIcon />}
      preset="accent4"
      label={<FormattedMessage id="chat-toolbar-button" defaultMessage="Chat" />}
    />
  );
}

export default ChatToolbarButton;
