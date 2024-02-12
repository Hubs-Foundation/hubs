import { calculateVolume, updateVolume } from "../components/audio-feedback";
import { EventEmitter } from "eventemitter3";

export class SoundAnalyzer extends EventEmitter {
  constructor({ stream, threshold = 25, interval = 20, silenceDur = 600 }) {
    super();

    this.audioContext = new window.AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.bufferLength = 32;
    this.analyser.fftSize = this.bufferLength;
    this.levels = new Uint8Array(this.bufferLength);

    this.silenceThresh = threshold;
    this.interval = interval;
    this.silentDur = silenceDur;

    this.consSilentInterv = null;
    this.streamNode = null;
    this.silent = null;

    this.volume = 0;
    this.prevVolume = 0;
    this.time = 0;

    if (!stream) return;

    this.Initialize = this.Initialize.bind(this);
    this.Initialize({ stream: stream });
  }

  Initialize({ stream, threshold = this.threshold, interval = this.interval, silenceDur = this.silenceDur }) {
    this.streamNode = this.audioContext.createMediaStreamSource(stream);
    this.silenceThresh = threshold;
    this.interval = interval;
    this.silentDur = silenceDur;

    this.streamNode.connect(this.analyser);

    this.consSilentInterv = 0;
    this.volume = 0;
    this.prevVolume = 0;

    this.analyzeSound = () => {
      this.analyser.getByteFrequencyData(this.levels);
      const averageAmplitude = this.levels.reduce((sum, value) => sum + value, 0) / this.bufferLength;

      if (averageAmplitude < this.silenceThresh) {
        this.consSilentInterv += this.interval;
        if (this.consSilentInterv > this.silentDur) {
          this.silent = true;
          this.emit("silence-state-change");
        } else {
          this.consSilentInterv = 0;
          this.silent = false;
          this.emit("silence-state-change");
        }
      }

      updateVolume(this);
      this.volume = averageAmplitude;
      //this.time += this.interval;
      // console.log(this.time);
      this.emit("data-available");
    };
  }

  Start() {
    this.emit("start");
    this.silenceCheckInterval = setInterval(this.analyzeSound, this.interval);
  }

  Stop() {
    clearInterval(this.silenceCheckInterval);
    this.silenceCheckInterval = null;
    this.emit("stop");
  }

  SetStream(newStream) {
    if (!newStream) {
      console.log("Invalid Stream");
      return;
    }
    this.Initialize({
      stream: newStream,
      threshold: this.silenceThresh,
      interval: this.interval,
      silenceDur: this.silentDur
    });
  }
}
