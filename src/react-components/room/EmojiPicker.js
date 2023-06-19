import React from "react";
import Picker from "emoji-picker-react";

export function EmojiPicker(props) {
  const {
    state: { preferences: theme }
  } = window.APP.store;

  return <Picker {...props} Theme={theme.theme.includes("dark") ? "dark" : "light"} />;
}
