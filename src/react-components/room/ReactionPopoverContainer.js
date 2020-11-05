import React from "react";
import { ReactionPopoverButton } from "./ReactionPopover";
import { spawnEmojiInFrontOfUser, emojis } from "../../components/emoji";

const items = emojis.map(emoji => ({
  src: emoji.particleEmitterConfig.src,
  onSelect: spawnEmojiInFrontOfUser,
  ...emoji
}));

export function ReactionPopoverContainer() {
  return <ReactionPopoverButton items={items} />;
}
