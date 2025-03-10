import { useCallback, useEffect, useState } from "react";
import { getPlayerInfo } from "../../../utils/component-utils";

export default function useAvatarVolume(sessionId, onMultiplierChanged) {
  const playerInfo = getPlayerInfo(sessionId);
  const controlsEl = playerInfo?.el.querySelector("[avatar-volume-controls]");
  const controls = controlsEl?.components["avatar-volume-controls"];
  const [multiplier, setMultiplier] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const onMultiplierUpdated = useCallback(
    ({ detail: { gainMultiplier } }) => {
      setMultiplier(gainMultiplier);
      onMultiplierChanged && onMultiplierChanged(gainMultiplier);
    },
    [onMultiplierChanged]
  );

  const updateMultiplier = useCallback(
    gainMultiplier => {
      if (!controls) return;
      setMultiplier(gainMultiplier);
      controls.updateGainMultiplier(gainMultiplier, true);
    },
    [controls]
  );

  const onLocalMutedUpdated = useCallback(({ detail: { muted } }) => {
    setIsMuted(muted);
  }, []);

  const updateMuted = useCallback(
    muted => {
      if (!controls) return;
      setIsMuted(!!muted);
      controls.updateLocalMuted(!!muted, true);
    },
    [controls]
  );

  useEffect(() => {
    if (!controlsEl) return;
    controlsEl.addEventListener("gain_multiplier_updated", onMultiplierUpdated);
    controlsEl.addEventListener("local_muted_updated", onLocalMutedUpdated);

    const gainMultiplier = APP.gainMultipliers.get(controls.audioEl);
    onMultiplierUpdated({ detail: { gainMultiplier } });
    const isLocalMuted = APP.mutedState.has(controls.audioEl);
    setIsMuted(isLocalMuted);

    return () => {
      controlsEl.removeEventListener("gain_multiplier_updated", onMultiplierUpdated);
      controlsEl.removeEventListener("local_muted_updated", onLocalMutedUpdated);
    };
  }, [controls, controlsEl, onMultiplierUpdated, onLocalMutedUpdated]);

  return [multiplier, updateMultiplier, isMuted, updateMuted];
}
