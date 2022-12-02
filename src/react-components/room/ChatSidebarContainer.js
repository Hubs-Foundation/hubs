import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  ChatSidebar,
  ChatMessageGroup,
  SystemMessage,
  ChatMessageList,
  ChatInput,
  MessageAttachmentButton,
  SpawnMessageButton,
  ChatToolbarButton,
  SendMessageButton,
  EmojiPickerPopoverButton,
  ChatLengthWarning,
  PermissionMessageGroup
} from "./ChatSidebar";
import { useMaintainScrollPosition } from "../misc/useMaintainScrollPosition";
import { spawnChatMessage } from "../chat-message";
import { discordBridgesForPresences } from "../../utils/phoenix-utils";
import { defineMessages, useIntl } from "react-intl";
import { MAX_MESSAGE_LENGTH } from "../../utils/chat-message";
import { PermissionNotification } from "./PermissionNotifications";
import { usePermissions } from "./usePermissions";
import { useRoomPermissions } from "./useRoomPermissions";
import { useRole } from "./useRole";

const ChatContext = createContext({ messageGroups: [], sendMessage: () => {} });

let uniqueMessageId = 0;

const NEW_MESSAGE_GROUP_TIMEOUT = 1000 * 60;

const chatSidebarMessages = defineMessages({
  emmptyRoom: {
    id: "chat-sidebar-container.input-placeholder.empty-room",
    defaultMessage: "Nobody is here yet..."
  },
  emmptyRoomBot: {
    id: "chat-sidebar-container.input-placeholder.empty-room-bot",
    defaultMessage: "Send message to {discordChannels}"
  },
  occupants: {
    id: "chat-sidebar-container.input-placeholder.occupants",
    defaultMessage:
      "{occupantCount, plural, one {Send message to one other...} other {Send message to {occupantCount} others...} }"
  },
  occupantsAndBot: {
    id: "chat-sidebar-container.input-placeholder.occupants-and-bot",
    defaultMessage:
      "{occupantCount, plural, one {Send message to one other and {discordChannels}...} other {Send message to {occupantCount} others and {discordChannels}...} }"
  },
  textChatOff: {
    id: "chat-sidebar-container.input-send-button.disabled",
    defaultMessage: "Text Chat Off"
  }
});

function shouldCreateNewMessageGroup(messageGroups, newMessage, now) {
  if (messageGroups.length === 0) {
    return true;
  }

  const lastMessageGroup = messageGroups[messageGroups.length - 1];

  if (lastMessageGroup.senderSessionId !== newMessage.sessionId) {
    return true;
  }
  if (lastMessageGroup.type !== newMessage.type) {
    return true;
  }

  const lastMessage = lastMessageGroup.messages[lastMessageGroup.messages.length - 1];

  return now - lastMessage.timestamp > NEW_MESSAGE_GROUP_TIMEOUT;
}

function processChatMessage(messageGroups, newMessage) {
  const now = Date.now();
  const { name, sent, sessionId, ...messageProps } = newMessage;

  if (shouldCreateNewMessageGroup(messageGroups, newMessage, now)) {
    return [
      ...messageGroups,
      {
        id: uniqueMessageId++,
        timestamp: now,
        sent,
        sender: name,
        senderSessionId: sessionId,
        messages: [{ id: uniqueMessageId++, timestamp: now, ...messageProps }],
        type: newMessage.type
      }
    ];
  }

  const lastMessageGroup = messageGroups.pop();
  lastMessageGroup.messages = [
    ...lastMessageGroup.messages,
    { id: uniqueMessageId++, timestamp: now, ...messageProps }
  ];

  return [...messageGroups, { ...lastMessageGroup }];
}

// Returns the new message groups array when we receive a message.
// If the message is ignored, we return the original message group array.
function updateMessageGroups(messageGroups, newMessage) {
  switch (newMessage.type) {
    case "join":
    case "entered":
    case "leave":
    case "display_name_changed":
    case "scene_changed":
    case "hub_name_changed":
    case "hub_changed":
    case "log":
      return [
        ...messageGroups,
        {
          id: uniqueMessageId++,
          systemMessage: true,
          timestamp: Date.now(),
          ...newMessage
        }
      ];
    case "chat":
    case "image":
    case "photo":
    case "video":
    case "permission":
      return processChatMessage(messageGroups, newMessage);
    default:
      return messageGroups;
  }
}

export function ChatContextProvider({ messageDispatch, children }) {
  const [messageGroups, setMessageGroups] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(false);
  const isMod = useRole("owner");

  useEffect(() => {
    function onReceiveMessage(event) {
      const newMessage = event.detail;

      if (isMod && newMessage.sessionId === NAF.clientId && newMessage.type === "permission") return;

      setMessageGroups(messages => updateMessageGroups(messages, newMessage));

      if (
        newMessage.type === "chat" ||
        newMessage.type === "image" ||
        newMessage.type === "photo" ||
        newMessage.type === "video" ||
        newMessage.type === "permission"
      ) {
        setUnreadMessages(true);
      }
    }

    if (messageDispatch) {
      messageDispatch.addEventListener("message", onReceiveMessage);
    }

    return () => {
      if (messageDispatch) {
        messageDispatch.removeEventListener("message", onReceiveMessage);
      }
    };
  }, [messageDispatch, setMessageGroups, setUnreadMessages, isMod]);

  const sendMessage = useCallback(
    message => {
      if (messageDispatch) {
        messageDispatch.dispatch(message);
      }
    },
    [messageDispatch]
  );

  const setMessagesRead = useCallback(() => {
    setUnreadMessages(false);
  }, [setUnreadMessages]);

  return (
    <ChatContext.Provider value={{ messageGroups, unreadMessages, sendMessage, setMessagesRead }}>
      {children}
    </ChatContext.Provider>
  );
}

ChatContextProvider.propTypes = {
  children: PropTypes.node,
  messageDispatch: PropTypes.object
};

export function ChatSidebarContainer({
  scene,
  canSpawnMessages,
  presences,
  occupantCount,
  initialValue,
  autoFocus,
  onClose
}) {
  const { messageGroups, sendMessage, setMessagesRead } = useContext(ChatContext);
  const [onScrollList, listRef, scrolledToBottom] = useMaintainScrollPosition(messageGroups);
  const [message, setMessage] = useState(initialValue || "");
  const [isCommand, setIsCommand] = useState(false);
  const { text_chat: canTextChat } = usePermissions();
  const isMod = useRole("owner");
  const { text_chat: textChatEnabled } = useRoomPermissions();
  const typingTimeoutRef = useRef();
  const intl = useIntl();
  const inputRef = useRef();

  const onKeyDown = useCallback(
    e => {
      setIsCommand(e.target.value.startsWith("/"));
      if (!canTextChat && !isCommand) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
          sendMessage(e.target.value);
          setMessage("");
          // intentionally only doing this on "enter" press and not clicking of send button
          if (e.target.value.startsWith("/")) {
            onClose();
          }
        }
      } else if (e.key === "Escape") {
        onClose();
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => window.APP.hubChannel.endTyping(), 500);
      window.APP.hubChannel.beginTyping();
    },
    [sendMessage, setMessage, onClose, canTextChat, isCommand]
  );

  const onSendMessage = useCallback(() => {
    sendMessage(message.substring(0, MAX_MESSAGE_LENGTH));
    setMessage("");
  }, [message, sendMessage, setMessage]);

  const onSpawnMessage = () => {
    spawnChatMessage(message);
    setMessage("");
  };

  const onUploadAttachments = useCallback(
    e => {
      // TODO: Right now there's no way to upload files to the chat only.
      // When we add the place menu whcih will have an explicit button for uploading files,
      // should we make this attach button only upload to chat?
      for (const file of e.target.files) {
        scene.emit("add_media", file);
      }
    },
    [scene]
  );

  const onSelectEmoji = useCallback(
    ({ emoji, pickerRemainedOpen }) => {
      setMessage(message => message + emoji.native);
      // If the picker remained open, avoid selecting the input so that the
      // user can keep picking emojis.
      if (!pickerRemainedOpen) inputRef.current.select();
    },
    [setMessage, inputRef]
  );

  useEffect(() => {
    if (autoFocus) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
    // We only want this effect to run on initial mount even if autoFocus were to change.
    // This does not happen in practice, but this is more correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrolledToBottom) {
      setMessagesRead();
    }
  }, [messageGroups, scrolledToBottom, setMessagesRead]);

  const discordBridges = discordBridgesForPresences(presences);
  const discordSnippet = discordBridges.map(ch => "#" + ch).join(", ");
  let placeholder;

  if (occupantCount <= 1) {
    if (discordBridges.length === 0) {
      placeholder = intl.formatMessage(chatSidebarMessages["emmptyRoom"]);
    } else {
      placeholder = intl.formatMessage(chatSidebarMessages["emmptyRoomBot"], { discordChannels: discordSnippet });
    }
  } else {
    if (discordBridges.length === 0) {
      placeholder = intl.formatMessage(chatSidebarMessages["occupants"], {
        discordChannels: discordSnippet,
        occupantCount: occupantCount - 1
      });
    } else {
      placeholder = intl.formatMessage(chatSidebarMessages["occupantsAndBot"], {
        discordChannels: discordSnippet,
        occupantCount: occupantCount - 1
      });
    }
  }

  const isMobile = AFRAME.utils.device.isMobile();
  const isOverMaxLength = message.length > MAX_MESSAGE_LENGTH;
  const isDisabled = message.length === 0 || isOverMaxLength || !canTextChat;
  return (
    <ChatSidebar onClose={onClose}>
      <ChatMessageList ref={listRef} onScroll={onScrollList}>
        {messageGroups.map(entry => {
          const { id, systemMessage, type } = entry;
          if (systemMessage) {
            return <SystemMessage key={id} {...entry} />;
          } else {
            if (type === "permission") {
              return <PermissionMessageGroup key={id} {...entry} />;
            } else {
              return <ChatMessageGroup key={id} {...entry} />;
            }
          }
        })}
      </ChatMessageList>
      {!canTextChat && <PermissionNotification permission={"text_chat"} />}
      {!textChatEnabled && isMod && <PermissionNotification permission={"text_chat"} isMod={true} />}
      <ChatInput
        id="chat-input"
        ref={inputRef}
        onKeyDown={onKeyDown}
        onChange={e => setMessage(e.target.value)}
        placeholder={placeholder}
        value={message}
        isOverMaxLength={isOverMaxLength}
        warning={
          <>
            {message.length + 50 > MAX_MESSAGE_LENGTH && (
              <ChatLengthWarning messageLength={message.length} maxLength={MAX_MESSAGE_LENGTH} />
            )}
          </>
        }
        afterInput={
          <>
            {!isMobile && <EmojiPickerPopoverButton onSelectEmoji={onSelectEmoji} />}
            {message.length === 0 && canSpawnMessages ? (
              <MessageAttachmentButton onChange={onUploadAttachments} />
            ) : (
              <SendMessageButton
                onClick={onSendMessage}
                as={"button"}
                disabled={isDisabled && !isCommand}
                title={isDisabled && !isCommand ? intl.formatMessage(chatSidebarMessages["textChatOff"]) : undefined}
              />
            )}
            {canSpawnMessages && (
              <SpawnMessageButton
                disabled={isDisabled}
                onClick={onSpawnMessage}
                title={isDisabled ? intl.formatMessage(chatSidebarMessages["textChatOff"]) : undefined}
              />
            )}
          </>
        }
      />
    </ChatSidebar>
  );
}

ChatSidebarContainer.propTypes = {
  canSpawnMessages: PropTypes.bool,
  presences: PropTypes.object.isRequired,
  occupantCount: PropTypes.number.isRequired,
  scene: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  autoFocus: PropTypes.bool,
  initialValue: PropTypes.string
};

export function ChatToolbarButtonContainer(props) {
  const { unreadMessages } = useContext(ChatContext);
  return <ChatToolbarButton {...props} statusColor={unreadMessages ? "unread" : undefined} />;
}
