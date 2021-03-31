import React from "react";
// import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import "./EmojiPicker.scss";

export function EmojiPicker(props) {
  return <Picker title="Pick an emoji!" color="var(--tab-highlight-color)" {...props} />;
}
