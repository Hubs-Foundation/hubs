import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import emoji0Particle from "../../assets/images/emojis/emoji_0.png";
import emoji1Particle from "../../assets/images/emojis/emoji_1.png";
import emoji2Particle from "../../assets/images/emojis/emoji_2.png";
import emoji3Particle from "../../assets/images/emojis/emoji_3.png";
import emoji4Particle from "../../assets/images/emojis/emoji_4.png";
import emoji5Particle from "../../assets/images/emojis/emoji_5.png";
import emoji6Particle from "../../assets/images/emojis/emoji_6.png";
import { ReactionPopoverButton } from "./ReactionPopover";

export default {
  title: "Room/ReactionPopover",
  parameters: {
    layout: "fullscreen"
  },
  argTypes: {
    onToggleHandRaised: {
      action: "Hand Raised Changed",
      table: {
        category: "Events"
      }
    }
  }
};

const items = [
  { id: "smile", label: "Smile", src: emoji0Particle },
  { id: "laugh", label: "Laugh", src: emoji1Particle },
  { id: "clap", label: "Clap", src: emoji2Particle },
  { id: "heart", label: "Heart", src: emoji3Particle },
  { id: "wave", label: "Wave", src: emoji4Particle },
  { id: "angry", label: "Angry", src: emoji5Particle },
  { id: "cry", label: "Cry", src: emoji6Particle }
];

export const Base = args => (
  <RoomLayout
    toolbarCenter={
      <ReactionPopoverButton
        presence={{ hand_raised: args.handRaised }}
        items={items}
        onToggleHandRaised={args.onToggleHandRaised}
      />
    }
  />
);

Base.args = {
  handRaised: false
};
