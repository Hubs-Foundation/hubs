import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./PermissionsMessages.scss";
import { useIntl, defineMessages } from "react-intl";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { ReactComponent as Microphone } from "../icons/Microphone.svg";
import { ReactComponent as Chat } from "../icons/Chat.svg";

export const permissionsIcons = {
  voiceChatEnabled: <Microphone />,
  voiceChatDisabled: <MicrophoneMutedIcon />,
  textChatEnabled: <Chat />,
  textChatDisabled: <Chat />
};

export const permissionsMessages = defineMessages({
  voiceChatEnabled: {
    id: "chat-sidebar.moderator-message.voice-chat-enabled",
    defaultMessage: "Voice chat has been turned on by a moderator.",
  },
  voiceChatDisabled: {
    id: "chat-sidebar.moderator-message.voice-chat-disabled",
    defaultMessage: "Voice chat has been turned off by a moderator."
  },
  textChatEnabled: {
    id: "chat-sidebar.moderator-message.text-chat-enabled",
    defaultMessage: "Text chat has been turned on by a moderator."
  },
  textChatDisabled: {
    id: "chat-sidebar.moderator-message.text-chat-disabled",
    defaultMessage: "Text chat has been turned off by a moderator."
  }
});

function camelize(text) {
  text = text.replace(/[-_\s.]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  return text.substring(0, 1).toLowerCase() + text.substring(1);
}

export function permissionMessage({permission, status}, intl) {
  const key = `${permission}_${status ? "enabled" : "disabled"}`;
  const message = intl.formatMessage(permissionsMessages[camelize(key)]);
  const icon = permissionsIcons[camelize(key)];
  return (
    <>
      {icon}
      <p>{message}</p>
    </>
  );
}

export function PermissionMessage({ permission }) {
  const intl = useIntl();
  return (<div key={permission} className={classNames(styles.pinnedMessage)}>
        {permissionMessage({
          permission: permission,
          status: false},
          intl)}
      </div>);
}

PermissionMessage.propTypes = {
  permission: PropTypes.string
};

function filteredPermissions(permissions, limit) {
  return limit ? Object.keys(permissions)
        .filter((perm) => limit.includes(perm) && permissions[perm] === false)
        .reduce((cur, key) => { return Object.assign(cur, { [key]: permissions[key] })}, {}) : permissions;
}

export function PermissionsMessages({ permissions, limit }) {
  const intl = useIntl();
  return (
    Object.keys(filteredPermissions(permissions, limit)).map(perm => {
      return <div key={perm} className={classNames(styles.pinnedMessage)}>
        {permissionMessage({
          permission: perm,
          status: permissions[perm]},
          intl)}
      </div>
    })
  );
}

PermissionsMessages.propTypes = {
  permissions: PropTypes.object,
  limit: PropTypes.array
};