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

export default function useAvatarVolume(sessionId) {
  const playerInfo = getPlayerInfo(sessionId);
  const controlsEl = playerInfo?.el.querySelector("[avatar-volume-controls]");
  const controls = controlsEl?.components["avatar-volume-controls"];
  const [levelStep, setLevelStep] = useState(0);
  const [level, setLevel] = useState(controls?.getGainMultiplier());
  const [isMuted, setIsMuted] = useState(controls?.isLocalMuted);

  const onGainMultiplierUpdated = useCallback(({ detail: { gainMultiplier } }) => {
    const newValue = calcLevel(gainMultiplier);
    setLevelStep(newValue > gainMultiplier ? calcLevelStepDown(gainMultiplier) : calcLevelStepUp(gainMultiplier));
    setLevel(newValue);
  }, []);

  const updateGainMultiplier = useCallback(
    value => {
      if (!controls) return;
      const gainMultiplier = calcGainMultiplier(value);
      controls.onGainMultiplierUpdated(gainMultiplier);
      const newValue = calcLevel(gainMultiplier);
      setLevelStep(newValue < value ? calcLevelStepDown(value) : calcLevelStepUp(value));
      setLevel(undefined);
    },
    [controls]
  );

  const updateMuted = useCallback(
    muted => {
      if (!controls) return;
      setIsMuted(!!muted);
      controls.onLocalMutedUpdated(!!muted);
    },
    [controls]
  );

  useEffect(
    () => {
      if (!controlsEl) return;
      controlsEl.addEventListener("gain_multiplier_updated", onGainMultiplierUpdated);
      onGainMultiplierUpdated({ detail: { gainMultiplier: controls.getGainMultiplier() } });
      setIsMuted(controls.isLocalMuted);
      return () => {
        controlsEl.removeEventListener("gain_multiplier_updated", onGainMultiplierUpdated);
      };
    },
    [controls, controlsEl, onGainMultiplierUpdated, updateMuted]
  );

  return [minLevel, maxLevel, levelStep, level, updateGainMultiplier, isMuted, updateMuted];
}
