import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./PermissionNotifications.scss";
import { useIntl, defineMessages } from "react-intl";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { ReactComponent as Microphone } from "../icons/Microphone.svg";
import { ReactComponent as Chat } from "../icons/Chat.svg";
import { ReactComponent as ChatOff } from "../icons/ChatOff.svg";

export const permissionsIcons = {
  voiceChatEnabled: <Microphone />,
  voiceChatDisabled: <MicrophoneMutedIcon />,
  voiceChatDisabledMod: <MicrophoneMutedIcon />,
  textChatEnabled: <Chat />,
  textChatDisabled: <ChatOff />,
  textChatDisabledMod: <ChatOff />
};

export const permissionsMessages = defineMessages({
  voiceChatEnabled: {
    id: "chat-sidebar.moderator-message.voice-chat-enabled",
    defaultMessage: "Voice chat has been turned on by a moderator"
  },
  voiceChatDisabled: {
    id: "chat-sidebar.moderator-message.voice-chat-disabled",
    defaultMessage: "Voice chat has been turned off by a moderator"
  },
  voiceChatDisabledMod: {
    id: "chat-sidebar.moderator-message.voice-chat-disabled-mod",
    defaultMessage: "Guests are unable to use voice chat"
  },
  textChatEnabled: {
    id: "chat-sidebar.moderator-message.text-chat-enabled",
    defaultMessage: "Text chat has been turned on by a moderator"
  },
  textChatDisabled: {
    id: "chat-sidebar.moderator-message.text-chat-disabled",
    defaultMessage: "Text chat has been turned off by a moderator"
  },
  textChatDisabledMod: {
    id: "chat-sidebar.moderator-message.text-chat-disabled-mod",
    defaultMessage: "Guests are unable to send chat messages"
  }
});

function camelize(text) {
  text = text.replace(/[-_\s.]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""));
  return text.substring(0, 1).toLowerCase() + text.substring(1);
}

export function permissionMessage({ permission, status, isMod = false }, intl) {
  const key = `${permission}_${status ? "enabled" : "disabled"}${isMod ? "_Mod" : ""}`;
  const message = intl.formatMessage(permissionsMessages[camelize(key)]);
  const icon = permissionsIcons[camelize(key)];
  return (
    <>
      {icon}
      <p>{message}</p>
    </>
  );
}

export function PermissionNotification({ permission, className, isMod }) {
  const intl = useIntl();
  return (
    <div key={permission} className={classNames(styles.pinnedMessage, className)}>
      {permissionMessage(
        {
          permission: permission,
          status: false,
          isMod
        },
        intl
      )}
    </div>
  );
}

PermissionNotification.propTypes = {
  permission: PropTypes.string,
  className: PropTypes.string,
  isMod: PropTypes.bool
};

PermissionNotification.defaultProps = {
  isMod: false
};
