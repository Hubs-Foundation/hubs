import { useCallback, useEffect, useState } from "react";
import { getPlayerInfo } from "../../utils/component-utils";
import {
  calcLevel,
  calcLevelStepDown,
  calcLevelStepUp,
  calcGainMultiplier,
  MAX_VOLUME_LABELS
} from "../../utils/avatar-volume-utils";

const minLevel = 0;
const maxLevel = MAX_VOLUME_LABELS - 1;

export default function useAvatarVolume(sessionId, updateVolume) {
  const playerInfo = getPlayerInfo(sessionId);
  const controlsEl = playerInfo?.el.querySelector("[avatar-volume-controls]");
  const controls = controlsEl?.components["avatar-volume-controls"];
  const [levelStep, setLevelStep] = useState(0);
  const [level, setLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const onGainMultiplierUpdated = useCallback(
    ({ detail: { gainMultiplier } }) => {
      const newLevel = calcLevel(gainMultiplier);
      setLevelStep(newLevel > level ? calcLevelStepDown(gainMultiplier) : calcLevelStepUp(gainMultiplier));
      setLevel(newLevel);
      updateVolume && updateVolume(newLevel);
    },
    [level, updateVolume]
  );

  const updateGainMultiplier = useCallback(
    value => {
      if (!controls) return;
      const gainMultiplier = calcGainMultiplier(value);
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

  useEffect(
    () => {
      if (!controlsEl) return;
      controlsEl.addEventListener("gain_multiplier_updated", onGainMultiplierUpdated);
      controlsEl.addEventListener("local_muted_updated", onLocalMutedUpdated);

      onGainMultiplierUpdated({ detail: { gainMultiplier: controls.getGainMultiplier() } });
      setIsMuted(controls.isLocalMuted());

      return () => {
        controlsEl.removeEventListener("gain_multiplier_updated", onGainMultiplierUpdated);
        controlsEl.removeEventListener("local_muted_updated", onLocalMutedUpdated);
      };
    },
    [controls, controlsEl, onGainMultiplierUpdated, onLocalMutedUpdated]
  );

  return [minLevel, maxLevel, levelStep, updateGainMultiplier, isMuted, updateMuted];
}
