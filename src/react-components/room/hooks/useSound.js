import { useRef, useCallback } from "react";

export function useSound({ scene, sound }) {
  const sfxSystem = scene.systems["hubs-systems"].soundEffectsSystem;
  const analyserRef = useRef(scene.systems["hubs-systems"].audioSystem.mixerAnalyser);

  const playSound = useCallback(() => {
    sfxSystem.playSoundOneShot(sound).connect(analyserRef.current);
  }, [sound, sfxSystem]);

  return { playSound };
}
