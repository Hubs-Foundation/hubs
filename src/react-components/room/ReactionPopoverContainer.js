import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { ReactionPopoverButton } from "./ReactionPopover";
import { spawnEmojiInFrontOfUser, emojis } from "../../components/emoji";
import { defineMessages, useIntl } from "react-intl";

const emojiLabels = defineMessages({
  smile: { id: "reaction-popover.emoji-label.smile", defaultMessage: "Smile" },
  laugh: { id: "reaction-popover.emoji-label.laugh", defaultMessage: "Laugh" },
  clap: { id: "reaction-popover.emoji-label.clap", defaultMessage: "Clap" },
  heart: { id: "reaction-popover.emoji-label.heart", defaultMessage: "Heart" },
  wave: { id: "reaction-popover.emoji-label.wave", defaultMessage: "Wave" },
  angry: { id: "reaction-popover.emoji-label.angry", defaultMessage: "Angry" },
  cry: { id: "reaction-popover.emoji-label.cry", defaultMessage: "Cry" }
});

function usePresence(scene, initialPresence) {
  const [presence, setPresence] = useState(initialPresence);

  const onPresenceUpdate = ({ detail: presence }) => {
    if (presence.sessionId === NAF.clientId) setPresence(presence);
  };
  useEffect(
    () => {
      scene.addEventListener("presence_updated", onPresenceUpdate);
      return () => scene.removeEventListener("presence_updated", onPresenceUpdate);
    },
    [scene]
  );

  return presence;
}

export function ReactionPopoverContainer({ scene, initialPresence }) {
  const intl = useIntl();
  const presence = usePresence(scene, initialPresence);

  const items = emojis.map(emoji => ({
    src: emoji.particleEmitterConfig.src,
    onSelect: spawnEmojiInFrontOfUser,
    label: intl.formatMessage(emojiLabels[emoji.id]),
    ...emoji
  }));

  const onToggleHandRaised = useCallback(
    () => {
      if (presence.hand_raised) {
        window.APP.hubChannel.lowerHand();
      } else {
        window.APP.hubChannel.raiseHand();
      }
    },
    [presence]
  );

  return <ReactionPopoverButton items={items} presence={presence} onToggleHandRaised={onToggleHandRaised} />;
}

ReactionPopoverContainer.propTypes = {
  scene: PropTypes.object,
  initialPresence: PropTypes.object
};
