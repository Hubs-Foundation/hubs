import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Sidebar } from "../sidebar/Sidebar";
import { ReactComponent as CloseIcon } from "../icons/Close.svg";
import { ReactComponent as WandIcon } from "../icons/Wand.svg";
import { IconButton } from "../input/IconButton";
import { TextAreaInput } from "../input/TextAreaInput";
import styles from "./ChatSidebar.scss";
import { formatMessageBody } from "../../utils/chat-message";

function ChatInput({ onSpawn, ...rest }) {
  return (
    <TextAreaInput
      placeholder="Message..."
      afterInput={
        <IconButton className={styles.wandIcon} onClick={onSpawn}>
          <WandIcon />
        </IconButton>
      }
      {...rest}
    />
  );
}

ChatInput.propTypes = {
  onSpawn: PropTypes.func
};

export function ChatMessageGroup({ sent, sender, timestamp, messages }) {
  return (
    <li className={classNames(styles.messageGroup, { [styles.sent]: sent })}>
      <p className={styles.messageGroupLabel}>
        {sender} | {timestamp}
      </p>
      <ul className={styles.messageGroupMessages}>
        {messages.map((message, idx) => {
          const isMediaMessage = typeof message === "object" && (message.type === "img" || message.type === "video");
          const { formattedBody, monospace, emoji } = isMediaMessage
            ? { formattedBody: message }
            : formatMessageBody(message);

          return (
            <div
              className={classNames(styles.messageBubble, {
                [styles.media]: isMediaMessage,
                [styles.emoji]: emoji,
                [styles.monospace]: monospace
              })}
              key={idx}
            >
              {formattedBody}
            </div>
          );
        })}
      </ul>
    </li>
  );
}

ChatMessageGroup.propTypes = {
  sent: PropTypes.bool,
  sender: PropTypes.string,
  timestamp: PropTypes.any,
  messages: PropTypes.array
};

export function ChatSidebar({ onClose, children }) {
  return (
    <Sidebar
      title="Chat"
      beforeTitle={
        <IconButton className={styles.closeButton} onClick={onClose}>
          <CloseIcon width={16} height={16} />
        </IconButton>
      }
      contentClassName={styles.content}
    >
      <li className={styles.messageList}>{children}</li>
      <div className={styles.chatInputContainer}>
        <ChatInput />
      </div>
    </Sidebar>
  );
}

ChatSidebar.propTypes = {
  onClose: PropTypes.func,
  children: PropTypes.node
};
