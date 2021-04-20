import React from "react";
import { Picker } from "emoji-mart";
// Twitter emoji sheets downloaded from unpkg.com provided by https://github.com/missive/emoji-mart
import emojiIcons16 from "../../assets/images/emoji-picker-16.png";
import emojiIcons20 from "../../assets/images/emoji-picker-20.png";
import emojiIcons32 from "../../assets/images/emoji-picker-32.png";
import emojiIcons64 from "../../assets/images/emoji-picker-64.png";

import "./EmojiPicker.scss";

const iconSheet = {
  16: emojiIcons16,
  20: emojiIcons20,
  32: emojiIcons32,
  64: emojiIcons64
};

export function EmojiPicker(props) {
  return (
    <Picker
      title="Pick an emoji!"
      color="var(--tab-highlight-color)"
      // eslint-disable-next-line no-unused-vars
      backgroundImageFn={(set, sheetSize) => iconSheet[sheetSize]}
      {...props}
    />
  );
}
