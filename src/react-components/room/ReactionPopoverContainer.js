import React from "react";
import PropTypes from "prop-types";
import { ReactionPopoverButton } from "./ReactionPopover";
import emoji0Particle from "../../assets/images/emojis/emoji_0.png";
import emoji1Particle from "../../assets/images/emojis/emoji_1.png";
import emoji2Particle from "../../assets/images/emojis/emoji_2.png";
import emoji3Particle from "../../assets/images/emojis/emoji_3.png";
import emoji4Particle from "../../assets/images/emojis/emoji_4.png";
import emoji5Particle from "../../assets/images/emojis/emoji_5.png";
import emoji6Particle from "../../assets/images/emojis/emoji_6.png";
import emoji0Model from "../../assets/models/emojis/emoji_0.glb";
import emoji1Model from "../../assets/models/emojis/emoji_1.glb";
import emoji2Model from "../../assets/models/emojis/emoji_2.glb";
import emoji3Model from "../../assets/models/emojis/emoji_3.glb";
import emoji4Model from "../../assets/models/emojis/emoji_4.glb";
import emoji5Model from "../../assets/models/emojis/emoji_5.glb";
import emoji6Model from "../../assets/models/emojis/emoji_6.glb";

const emojis = [
  { id: "smile", label: "Smile", src: emoji0Particle, model: emoji0Model, particle: emoji0Particle },
  { id: "laugh", label: "Laugh", src: emoji1Particle, model: emoji1Model, particle: emoji1Particle },
  { id: "clap", label: "Clap", src: emoji2Particle, model: emoji2Model, particle: emoji2Particle },
  { id: "heart", label: "Heart", src: emoji3Particle, model: emoji3Model, particle: emoji3Particle },
  { id: "wave", label: "Wave", src: emoji4Particle, model: emoji4Model, particle: emoji4Particle },
  { id: "angry", label: "Angry", src: emoji5Particle, model: emoji5Model, particle: emoji5Particle },
  { id: "cry", label: "Cry", src: emoji6Particle, model: emoji6Model, particle: emoji6Particle }
];

export function ReactionPopoverContainer({ scene }) {
  const items = emojis.map(emoji => ({ ...emoji, onSelect: console.log(emoji) }));

  return <ReactionPopoverButton items={items} />;
}

ReactionPopoverContainer.propTypes = {
  scene: PropTypes.object.isRequired
};
