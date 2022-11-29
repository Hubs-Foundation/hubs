import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { Tip } from "./Tip";
import { useEffect } from "react";
import { discordBridgesForPresences, hasEmbedPresences } from "../../utils/phoenix-utils";
import { Tooltip } from "./Tooltip";

const isEndTooltipStep = step =>
  ["tips.desktop.end", "tips.mobile.end", "tips.desktop.menu", "tips.mobile.menu"].includes(step);

function OkDismissLabel() {
  return <FormattedMessage id="tips.dismiss.ok" defaultMessage="Ok" />;
}

export function FullscreenTip(props) {
  return (
    <Tip {...props} dismissLabel={<OkDismissLabel />}>
      <FormattedMessage id="tips.fullscreen" defaultMessage="Entered fullscreen mode. Press Escape to show UI." />
    </Tip>
  );
}

export function TipContainer({ inLobby, inRoom, isStreaming, isEmbedded, scene, store, hubId, presences }) {
  const [lobbyTipDismissed, setLobbyTipDismissed] = useState(false);
  const [broadcastTipDismissed, setBroadcastTipDismissed] = useState(() =>
    store.state.confirmedBroadcastedRooms.includes(hubId)
  );
  const [streamingTipDismissed, setStreamingTipDismissed] = useState(false);
  const [embeddedTipDismissed, setEmbeddedTipDismissed] = useState(false);
  const [onboardingTipId, setOnboardingTipId] = useState(null);

  const onSkipOnboarding = useCallback(() => {
    setOnboardingTipId(null);
    setTimeout(() => {
      scene.systems.tips.skipTips();
    }, 200);
  }, [scene]);

  const onNextTip = useCallback(() => {
    setOnboardingTipId(null);
    setTimeout(() => {
      scene.systems.tips.nextTip();
    }, 200);
  }, [scene]);

  const onPrevTip = useCallback(() => {
    setOnboardingTipId(null);
    setTimeout(() => {
      scene.systems.tips.prevTip();
    }, 200);
  }, [scene]);

  useEffect(() => {
    if (isEndTooltipStep(onboardingTipId)) {
      setTimeout(() => {
        scene.systems.tips.nextTip();
      }, 2500);
    }
  }, [scene, onboardingTipId]);

  useEffect(() => {
    function onSceneTipChanged({ detail: tipId }) {
      setOnboardingTipId(null);
      setTimeout(() => {
        setOnboardingTipId(tipId);
      }, 250);
    }

    scene.addEventListener("tip-changed", onSceneTipChanged);

    setOnboardingTipId(scene.systems.tips.activeTip);
  }, [scene]);

  const discordBridges = presences ? discordBridgesForPresences(presences) : [];
  const isBroadcasting = discordBridges.length > 0;

  if (inLobby) {
    if (lobbyTipDismissed) {
      return null;
    }

    return (
      <Tip onDismiss={() => setLobbyTipDismissed(true)} dismissLabel={<OkDismissLabel />}>
        <FormattedMessage id="tips.lobby" defaultMessage="You're in the lobby. Others cannot see or hear you." />
      </Tip>
    );
  } else if (inRoom) {
    if (onboardingTipId) {
      return <Tooltip onPrev={onPrevTip} onNext={onNextTip} onDismiss={onSkipOnboarding} step={onboardingTipId} />;
    }

    if (isStreaming && !streamingTipDismissed) {
      return (
        <Tip onDismiss={() => setStreamingTipDismissed(true)} dismissLabel={<OkDismissLabel />}>
          <FormattedMessage
            id="tips.streaming"
            defaultMessage="Now broadcasting to the lobby. Exit streamer mode in the more menu when you're done."
          />
        </Tip>
      );
    }

    if (isBroadcasting && !broadcastTipDismissed) {
      return (
        <Tip onDismiss={() => setBroadcastTipDismissed(true)} dismissLabel={<OkDismissLabel />}>
          <FormattedMessage
            id="tips.discord"
            defaultMessage="Chat in this room is being bridged to {broadcastTarget} on Discord."
            values={{ broadcastTarget: discordBridges.map(channelName => "#" + channelName).join(", ") }}
          />
        </Tip>
      );
    }

    if ((isEmbedded || hasEmbedPresences(presences)) && !embeddedTipDismissed) {
      return (
        <Tip onDismiss={() => setEmbeddedTipDismissed(true)} dismissLabel={<OkDismissLabel />}>
          <FormattedMessage
            id="tips.embedded"
            defaultMessage="This room is embedded, so it may be visible to visitors on other websites."
          />
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
