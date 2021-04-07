import React from "react";
import { Picker } from "emoji-mart";
import "./EmojiPicker.scss";

export function EmojiPicker(props) {
  return <Picker title="Pick an emoji!" color="var(--tab-highlight-color)" {...props} />;
}
