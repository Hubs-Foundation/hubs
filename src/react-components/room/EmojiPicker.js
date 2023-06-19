import React from "react";
import Picker from "emoji-picker-react";

import "./EmojiPicker.scss";

export function EmojiPicker(props) {
  return <Picker {...props} />;
}
