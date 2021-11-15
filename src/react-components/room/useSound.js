import { useEffect, useState, useRef, useCallback } from "react";
import MovingAverage from "moving-average";
import { SourceType } from "../../components/audio-params";

export function useSound({ scene, updateRate = 50, webmSrc, mp3Src, oggSrc, wavSrc }) {
  const audioSystem = scene.systems["hubs-systems"].audioSystem;
  const soundTimeoutRef = useRef();
  const movingAvgRef = useRef();
  const audioElRef = useRef();
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0);

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

      scene.emit("sound-created", source);

      audioElRef.current = audio;

      if (!movingAvgRef.current) {
        movingAvgRef.current = MovingAverage(updateRate * 2);
      }

      let max = 0;
      let timeout;

      const updateSoundVolume = () => {
        const analyser = scene.systems["sound-audio-analyser"];
        max = Math.max(analyser.volume, max);
        // We use a moving average to smooth out the visual animation or else it would twitch too fast for
        // the css renderer to keep up.
        movingAvgRef.current.push(Date.now(), analyser.volume);
        const average = movingAvgRef.current.movingAverage();
        const nextVolume = max === 0 ? 0 : average / max;
        setSoundVolume(prevVolume => (Math.abs(prevVolume - nextVolume) > 0.05 ? nextVolume : prevVolume));
        timeout = setTimeout(updateSoundVolume, updateRate);
      };

      updateSoundVolume();

      return () => {
        audioElRef.current.pause();
        audioElRef.current.currentTime = 0;
        clearTimeout(soundTimeoutRef.current);
        clearTimeout(timeout);
      };
    },
    [audioSystem, setSoundVolume, scene, updateRate, webmSrc, mp3Src, oggSrc, wavSrc]
  );

  const playSound = useCallback(
    () => {
      const audio = audioElRef.current;

      if (audio) {
        audio.currentTime = 0;
        clearTimeout(soundTimeoutRef.current);
        audio.play();
        setSoundPlaying(true);

        soundTimeoutRef.current = setTimeout(() => {
          setSoundPlaying(false);
        }, 1393);
      }
    },
    [audioElRef, setSoundPlaying]
  );

  return [soundPlaying, playSound, soundVolume];
}
