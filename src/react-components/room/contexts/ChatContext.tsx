import React, { createContext, useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useRole } from "../hooks/useRole";

type ChatContextValuesT = {
  messageGroups: any[];
  sendMessage: (message: any) => void;
  unreadMessages?: boolean;
  setMessagesRead?: () => void;
};

export const ChatContext = createContext<ChatContextValuesT>({ messageGroups: [], sendMessage: message => {} });

let uniqueMessageId = 0;

const NEW_MESSAGE_GROUP_TIMEOUT = 1000 * 60;

function shouldCreateNewMessageGroup(messageGroups: any[], newMessage: { sessionId: any; type: any }, now: number) {
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

function processChatMessage(
  messageGroups: any[],
  newMessage: { [x: string]: any; type: any; name: any; sent: any; sessionId: any }
) {
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
function updateMessageGroups(
  messageGroups: any[],
  newMessage: { [x: string]: any; type: any; name: any; sent: any; sessionId: any }
) {
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

export function ChatContextProvider({ messageDispatch, children }: { messageDispatch: any; children: any }) {
  const [messageGroups, setMessageGroups] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<boolean>(false);
  const isMod = useRole("owner");

  useEffect(() => {
    function onReceiveMessage(event: { detail: any }) {
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
    (message: any) => {
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
