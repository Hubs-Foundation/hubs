import { useRef, useCallback } from "react";
import { useVolumeMeter } from "../misc/useVolumeMeter";

export function useSound({ scene, updateRate = 50, sound }) {
  const sfxSystem = scene.systems["hubs-systems"].soundEffectsSystem;
  const analyserRef = useRef(scene.systems["hubs-systems"].audioSystem.mixerAnalyser);
  const { volume } = useVolumeMeter({ analyser: analyserRef.current, updateRate });

  const playSound = useCallback(
    () => {
      sfxSystem.playSoundOneShot(sound).connect(analyserRef.current);
    },
    [sound, sfxSystem]
  );

  return { playSound, soundVolume: volume };
}
