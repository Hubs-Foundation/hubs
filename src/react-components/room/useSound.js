import { useEffect, useState, useRef, useCallback } from "react";
import { SourceType } from "../../components/audio-params";
import { useVolumeMeter } from "../misc/useVolumeMeter";

export function useSound({ scene, updateRate = 50, webmSrc, mp3Src, oggSrc, wavSrc }) {
  const audioSystem = scene.systems["hubs-systems"].audioSystem;
  const soundTimeoutRef = useRef();
  const audioElRef = useRef();
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const { soundVolume, onAttachSource, onDettachSource } = useVolumeMeter({ updateRate });

  useEffect(
    () => {
      const audio = document.createElement("audio");

      if (audio.canPlayType("audio/webm")) {
        audio.src = webmSrc;
      } else if (audio.canPlayType("audio/mpeg")) {
        audio.src = mp3Src;
      } else if (audio.canPlayType("audio/ogg")) {
        audio.src = oggSrc;
      } else {
        audio.src = wavSrc;
      }

      const audioCtx = THREE.AudioContext.getContext();
      const source = audioCtx.createMediaElementSource(audio);
      audioSystem.addAudio({ sourceType: SourceType.SFX, node: source });

      onAttachSource(source);
      audioElRef.current = audio;

      return () => {
        audioElRef.current.pause();
        audioElRef.current.currentTime = 0;
        clearTimeout(soundTimeoutRef.current);
        onDettachSource();
      };
    },
    [audioSystem, onAttachSource, onDettachSource, scene, webmSrc, mp3Src, oggSrc, wavSrc]
  );

  const playSound = useCallback(
    () => {
      const audio = audioElRef.current;

      if (audio) {
        audio.currentTime = 0;
        clearTimeout(soundTimeoutRef.current);
        audio.play();
        setIsSoundPlaying(true);

        soundTimeoutRef.current = setTimeout(() => {
          setIsSoundPlaying(false);
        }, 1393);
      }
    },
    [audioElRef, setIsSoundPlaying]
  );

  return [isSoundPlaying, playSound, soundVolume];
}
