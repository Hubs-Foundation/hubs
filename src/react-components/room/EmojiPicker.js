import React from "react";
import Picker from "emoji-picker-react";

export function EmojiPicker(props) {
  return <Picker {...props} emojiStyle="twitter" />;
}
