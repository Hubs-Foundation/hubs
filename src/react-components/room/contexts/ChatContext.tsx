import React, { ReactNode, createContext, useCallback, useEffect, useState } from "react";
import { useRole } from "../hooks/useRole";

type ChatContextValuesT = {
  messageGroups: any[];
  sendMessage: (message: any) => void;
  unreadMessages?: boolean;
  setMessagesRead?: () => void;
};

type NewMessageT = {
  [x: string]: any;
  type: string;
  name: string;
  sent: boolean;
  sessionId: string;
  messages: NewMessageT[];
};

export const ChatContext = createContext<ChatContextValuesT>({ messageGroups: [], sendMessage: message => {} });

let uniqueMessageId = 0;

const NEW_MESSAGE_GROUP_TIMEOUT = 1000 * 60;

function shouldCreateNewMessageGroup(messageGroups: NewMessageT[], newMessage: NewMessageT, now: number) {
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

function processChatMessage(messageGroups: any[], newMessage: NewMessageT) {
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
function updateMessageGroups(messageGroups: any[], newMessage: NewMessageT) {
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

type ChatContextProviderPropsT = {
  children: ReactNode;
  messageDispatch: Record<string, any>;
};

export function ChatContextProvider({ messageDispatch, children }: ChatContextProviderPropsT) {
  const [messageGroups, setMessageGroups] = useState<NewMessageT[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<boolean>(false);
  const isMod = useRole("owner");

  useEffect(() => {
    function onReceiveMessage(event: { detail: NewMessageT }) {
      const newMessage = event.detail;

      if (isMod && newMessage.sessionId === NAF.clientId && newMessage.type === "permission") return;

      setMessageGroups(messages => updateMessageGroups(messages, newMessage));

      if (["chat", "image", "photo", "video", "permission"].includes(newMessage.type)) {
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
    (message: string) => {
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
