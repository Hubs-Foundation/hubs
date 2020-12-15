import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Sidebar } from "../sidebar/Sidebar";
import { CloseButton } from "../input/CloseButton";
import { ReactComponent as WandIcon } from "../icons/Wand.svg";
import { ReactComponent as AttachIcon } from "../icons/Attach.svg";
import { ReactComponent as ChatIcon } from "../icons/Chat.svg";
import { ReactComponent as SendIcon } from "../icons/Send.svg";
import { IconButton } from "../input/IconButton";
import { TextAreaInput } from "../input/TextAreaInput";
import { ToolbarButton } from "../input/ToolbarButton";
import styles from "./ChatSidebar.scss";
import { formatMessageBody } from "../../utils/chat-message";
import { FormattedMessage, useIntl, defineMessages } from "react-intl";
import { useRelativeTime } from "../misc/useRelativeTime";

export function SpawnMessageButton(props) {
  return (
    <IconButton className={styles.chatInputIcon} {...props}>
      <WandIcon />
    </IconButton>
  );
}

export function SendMessageButton(props) {
  return (
    <IconButton className={styles.chatInputIcon} {...props}>
      <SendIcon />
    </IconButton>
  );
}

export function MessageAttachmentButton(props) {
  return (
    <>
      <IconButton as="label" className={styles.chatInputIcon}>
        <AttachIcon />
        <input type="file" {...props} />
      </IconButton>
    </>
  );
}

export function ChatInput(props) {
  return (
    <div className={styles.chatInputContainer}>
      <TextAreaInput placeholder="Message..." {...props} />
    </div>
  );
}

ChatInput.propTypes = {
  onSpawn: PropTypes.func
};

const joinMessages = defineMessages({
  room: { id: "presence.entered_room", defaultMessage: "{name} entered the room." },
  lobby: { id: "presence.entered_lobby", defaultMessage: "{name} entered the lobby." }
});

const enteredMessages = defineMessages({
  lobby: { id: "presence.join_lobby", defaultMessage: "{name} joined the lobby." },
  room: { id: "presence.join_room", defaultMessage: "{name} joined the room." }
});

// TODO: use react-intl's defineMessages to get proper extraction
export function formatSystemMessage(entry, intl) {
  switch (entry.type) {
    case "join":
      return intl.formatMessage(joinMessages[entry.presence], { name: <b>{entry.name}</b> });
    case "entered":
      return intl.formatMessage(enteredMessages[entry.presence], { name: <b>{entry.name}</b> });
    case "leave":
      return <FormattedMessage id="presence.leave" values={{ name: <b>{entry.name}</b> }} />;
    case "display_name_changed":
      return (
        <FormattedMessage
          id="presence.name_change"
          values={{ oldName: <b>{entry.oldName}</b>, newName: <b>{entry.newName}</b> }}
        />
      );
    case "scene_changed":
      return (
        <FormattedMessage
          id="presence.scene_change"
          values={{ name: <b>{entry.name}</b>, sceneName: <b>{entry.sceneName}</b> }}
        />
      );
    case "hub_name_changed":
      return (
        <FormattedMessage
          id="presence.hub_name_change"
          values={{ name: <b>{entry.name}</b>, hubName: <b>{entry.hubName}</b> }}
        />
      );
    case "log":
      return entry.body;
    default:
      return null;
  }
}

export function SystemMessage(props) {
  const relativeTime = useRelativeTime(props.timestamp);
  const intl = useIntl();

  return (
    <li className={classNames(styles.messageGroup, styles.systemMessage)}>
      <p className={styles.messageGroupLabel}>
        <i>{formatSystemMessage(props, intl)}</i>
        <span>{relativeTime}</span>
      </p>
    </li>
  );
}

SystemMessage.propTypes = {
  timestamp: PropTypes.any
};

function MessageBubble({ media, monospace, emoji, children }) {
  return (
    <div
      className={classNames(styles.messageBubble, {
        [styles.media]: media,
        [styles.emoji]: emoji,
        [styles.monospace]: monospace
      })}
    >
      {children}
    </div>
  );
}

MessageBubble.propTypes = {
  media: PropTypes.bool,
  monospace: PropTypes.bool,
  emoji: PropTypes.bool,
  children: PropTypes.node
};

function getMessageComponent(message) {
  switch (message.type) {
    case "chat": {
      const { formattedBody, monospace, emoji } = formatMessageBody(message.body);
      return (
        <MessageBubble key={message.id} monospace={monospace} emoji={emoji}>
          {formattedBody}
        </MessageBubble>
      );
    }
    case "video":
      return (
        <MessageBubble key={message.id} media>
          <video controls src={message.body.src} />
        </MessageBubble>
      );
    case "image":
    case "photo":
      return (
        <MessageBubble key={message.id} media>
          <img src={message.body.src} />
        </MessageBubble>
      );
    default:
      return null;
  }
}

export function ChatMessageGroup({ sent, sender, timestamp, messages }) {
  const relativeTime = useRelativeTime(timestamp);

  return (
    <li className={classNames(styles.messageGroup, { [styles.sent]: sent })}>
      <p className={styles.messageGroupLabel}>
        {sender} | {relativeTime}
      </p>
      <ul className={styles.messageGroupMessages}>{messages.map(message => getMessageComponent(message))}</ul>
    </li>
  );
}

ChatMessageGroup.propTypes = {
  sent: PropTypes.bool,
  sender: PropTypes.string,
  timestamp: PropTypes.any,
  messages: PropTypes.array
};

export const ChatMessageList = forwardRef(({ children, ...rest }, ref) => (
  <ul {...rest} className={styles.messageList} ref={ref}>
    {children}
  </ul>
));

ChatMessageList.propTypes = {
  children: PropTypes.node
};

export function ChatSidebar({ onClose, children, ...rest }) {
  return (
    <Sidebar title="Chat" beforeTitle={<CloseButton onClick={onClose} />} contentClassName={styles.content} {...rest}>
      {children}
    </Sidebar>
  );
}

ChatSidebar.propTypes = {
  onClose: PropTypes.func,
  onScrollList: PropTypes.func,
  children: PropTypes.node,
  listRef: PropTypes.func
};

export function ChatToolbarButton(props) {
  return <ToolbarButton {...props} icon={<ChatIcon />} preset="blue" label="Chat" />;
}
