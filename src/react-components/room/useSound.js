import { useEffect, useState, useRef, useCallback } from "react";

export function useSound({ webmSrc, mp3Src, oggSrc, wavSrc }) {
  const soundTimeoutRef = useRef();
  const audioElRef = useRef();
  const [soundPlaying, setSoundPlaying] = useState(false);

  useEffect(
    () => {
      const audioEl = document.createElement("audio");

      if (audioEl.canPlayType("audio/webm")) {
        audioEl.src = webmSrc;
      } else if (audioEl.canPlayType("audio/mpeg")) {
        audioEl.src = mp3Src;
      } else if (audioEl.canPlayType("audio/ogg")) {
        audioEl.src = oggSrc;
      } else {
        audioEl.src = wavSrc;
      }

      audioElRef.current = audioEl;

      return () => {
        audioEl.pause();
        audioEl.currentTime = 0;
        clearTimeout(soundTimeoutRef.current);
      };
    },
    [webmSrc, mp3Src, oggSrc, wavSrc]
  );

  const playSound = useCallback(
    () => {
      const audioEl = audioElRef.current;

      if (audioEl) {
        audioEl.currentTime = 0;
        clearTimeout(soundTimeoutRef.current);
        audioEl.play();
        setSoundPlaying(true);

        soundTimeoutRef.current = setTimeout(() => {
          setSoundPlaying(false);
        }, 1393);
      }
    },
    [audioElRef, setSoundPlaying]
  );

  return [soundPlaying, playSound];
}
