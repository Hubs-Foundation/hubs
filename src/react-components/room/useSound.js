import { useEffect, useState, useRef, useCallback } from "react";
import MovingAverage from "moving-average";

export function useSound({ scene, updateRate = 50, webmSrc, mp3Src, oggSrc, wavSrc }) {
  const soundTimeoutRef = useRef();
  const movingAvgRef = useRef();
  const audioElRef = useRef();
  const outputAudioElRef = useRef();
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0);
  const isAudioOutputSelectionEnabled = window.APP.mediaDevicesManager.isAudioOutputSelectEnabled;

  useEffect(
    () => {
      const audio = document.createElement("audio");
      // scene.emit("sound-created", audio);

      if (audio.canPlayType("audio/webm")) {
        audio.src = webmSrc;
      } else if (audio.canPlayType("audio/mpeg")) {
        audio.src = mp3Src;
      } else if (audio.canPlayType("audio/ogg")) {
        audio.src = oggSrc;
      } else {
        audio.src = wavSrc;
      }

      if (isAudioOutputSelectionEnabled) {
        // Just setting the sinkId on the media element doens't work anymore as we are routing the audio output of an AudioContext.
        // We need to use a MediaStreamAudioDestinationNode. This is very hacky but there are no alternatived at the time of writing this.
        // https://stackoverflow.com/a/67043782
        const audioCtx = THREE.AudioContext.getContext();
        const source = audioCtx.createMediaElementSource(audio);
        const destination = audioCtx.createMediaStreamDestination();
        source.connect(destination);

        const deviceId = window.APP.mediaDevicesManager.selectedOutputDeviceId;

        const outputAudio = new Audio();
        outputAudio.srcObject = destination.stream;
        outputAudio.setSinkId(deviceId);

        outputAudioElRef.current = outputAudio;
      }

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

      const onOutputDeviceUpdatedUpdated = () => {
        const { lastUsedOutputDeviceId } = window.APP.store.state.settings;
        if (outputAudioElRef.current) {
          outputAudioElRef.current.setSinkId(lastUsedOutputDeviceId);
        }
      };
      isAudioOutputSelectionEnabled && window.APP.store.addEventListener("statechanged", onOutputDeviceUpdatedUpdated);

      return () => {
        audioElRef.current.pause();
        audioElRef.current.currentTime = 0;
        clearTimeout(soundTimeoutRef.current);
        clearTimeout(timeout);

        if (isAudioOutputSelectionEnabled) {
          outputAudioElRef.current.pause();
          outputAudioElRef.current.currentTime = 0;
          window.APP.store.removeEventListener("statechanged", onOutputDeviceUpdatedUpdated);
        }
      };
    },
    [setSoundVolume, scene, updateRate, webmSrc, mp3Src, oggSrc, wavSrc]
  );

  const playSound = useCallback(
    () => {
      const audio = audioElRef.current;
      const outputAudio = outputAudioElRef.current;

      if (audio) {
        audio.currentTime = 0;
        outputAudio && (outputAudio.currentTime = 0);
        clearTimeout(soundTimeoutRef.current);
        audio.play();
        outputAudio && outputAudio.play();
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
