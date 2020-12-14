import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { FormattedMessage, useIntl, defineMessages } from "react-intl";
import { Tip } from "./Tip";
import { useEffect } from "react";
import { discordBridgesForPresences, hasEmbedPresences } from "../../utils/phoenix-utils";

const onboardingMessages = defineMessages({
  "tips.mobile.look": {
    id: "tips.mobile.look",
    defaultMessage: "Welcome! 👋 Tap and drag to look around."
  },
  "tips.mobile.locomotion": {
    id: "tips.mobile.locomotion",
    defaultMessage: "Great! To move, pinch with two fingers."
  },
  "tips.mobile.invite": {
    id: "tips.mobile.invite",
    defaultMessage: "Use the Invite button in the bottom left to share this room."
  },
  "tips.desktop.look": {
    id: "tips.desktop.look",
    defaultMessage: "Welcome to %app-name%! Let's take a quick tour. 👋 Click and drag to look around."
  },
  "tips.desktop.locomotion": {
    id: "tips.desktop.locomotion",
    defaultMessage: "Use the W A S D keys to move. Hold shift to boost."
  },
  "tips.desktop.turning": {
    id: "tips.desktop.turning",
    defaultMessage: "Perfect. Use the Q and E keys to rotate."
  },
  "tips.desktop.invite": {
    id: "tips.desktop.invite",
    defaultMessage: "Nobody else is here. Use the invite button in the bottom left to share this room."
  }
});

export function TipContainer({ hide, inLobby, inRoom, isStreaming, isEmbedded, scene, store, hubId, presences }) {
  const intl = useIntl();
  const [lobbyTipDismissed, setLobbyTipDismissed] = useState(false);
  const [broadcastTipDismissed, setBroadcastTipDismissed] = useState(() =>
    store.state.confirmedBroadcastedRooms.includes(hubId)
  );
  const [streamingTipDismissed, setStreamingTipDismissed] = useState(false);
  const [embeddedTipDismissed, setEmbeddedTipDismissed] = useState(false);
  const [onboardingTipId, setOnboardingTipId] = useState(null);

  const onSkipOnboarding = useCallback(
    () => {
      scene.systems.tips.skipTips();
    },
    [scene]
  );

  useEffect(
    () => {
      function onSceneTipChanged({ detail: tipId }) {
        setOnboardingTipId(tipId);
      }

      scene.addEventListener("tip-changed", onSceneTipChanged);

      setOnboardingTipId(scene.systems.tips.activeTip);
    },
    [scene]
  );

  const discordBridges = presences ? discordBridgesForPresences(presences) : [];
  const isBroadcasting = discordBridges.length > 0;

  // TODO: This only exists because we store local state in this component.
  // If we move tip state to a context then we can remove this and not render this component at all.
  if (hide) {
    return null;
  }

  if (inLobby) {
    if (lobbyTipDismissed) {
      return null;
    }

    return (
      <Tip onDismiss={() => setLobbyTipDismissed(true)} dismissLabel={<FormattedMessage id="tips.dismiss.ok" />}>
        <FormattedMessage id="tips.lobby" />
      </Tip>
    );
  } else if (inRoom) {
    if (onboardingTipId) {
      return (
        <Tip onDismiss={onSkipOnboarding} dismissLabel={<FormattedMessage id="tips.dismiss.skip" />}>
          {intl.formatMessage(onboardingMessages[onboardingTipId])}
        </Tip>
      );
    }

    if (isStreaming && !streamingTipDismissed) {
      return (
        <Tip onDismiss={() => setStreamingTipDismissed(true)} dismissLabel={<FormattedMessage id="tips.dismiss.ok" />}>
          <FormattedMessage id="tips.streaming" />
        </Tip>
      );
    }

    if (isBroadcasting && !broadcastTipDismissed) {
      return (
        <Tip onDismiss={() => setBroadcastTipDismissed(true)} dismissLabel={<FormattedMessage id="tips.dismiss.ok" />}>
          <FormattedMessage
            id="tips.discord"
            values={{ broadcastTarget: discordBridges.map(channelName => "#" + channelName).join(", ") }}
          />
        </Tip>
      );
    }

    if ((isEmbedded || hasEmbedPresences(presences)) && !embeddedTipDismissed) {
      return (
        <Tip onDismiss={() => setEmbeddedTipDismissed(true)} dismissLabel={<FormattedMessage id="tips.dismiss.ok" />}>
          <FormattedMessage id="tips.embedded" />
        </Tip>
      );
    }

    return null;
  }

  return null;
}

TipContainer.propTypes = {
  hide: PropTypes.bool,
  inLobby: PropTypes.bool,
  inRoom: PropTypes.bool,
  isStreaming: PropTypes.bool,
  isEmbedded: PropTypes.bool,
  scene: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired,
  hubId: PropTypes.string,
  presences: PropTypes.object
};
