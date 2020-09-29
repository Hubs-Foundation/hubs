import React, { createContext } from "react";
import PropTypes from "prop-types";

const ChatContext = createContext();

export function ChatContextProvider({ children }) {
  return <ChatContext.Provider>{children}</ChatContext.Provider>;
}

ChatContextProvider.propTypes = {
  children: PropTypes.node
};

export function ChatSidebarContainer() {
  return <div />;
}
