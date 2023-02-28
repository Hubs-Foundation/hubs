import { defineQuery } from "bitecs";
import { HubsWorld } from "../app";
import { LocalAudioAnalyser } from "../bit-components";
import { AudioSystem } from "../systems/audio-system";
import { updateVolume } from "../utils/avatar-audio-utils";

const localAudioAnalyserQuery = defineQuery([LocalAudioAnalyser]);
export function localAudioAnalyserSystem(world: HubsWorld, audioSystem: AudioSystem) {
  localAudioAnalyserQuery(world).forEach(eid => {
    if (APP.dialog.isMicEnabled) {
      const newVolume = updateVolume({
        analyser: audioSystem.outboundAnalyser,
        levels: audioSystem.analyserLevels,
        volume: LocalAudioAnalyser.volume[eid],
        prevVolume: LocalAudioAnalyser.prevVolume[eid]
      });
      LocalAudioAnalyser.prevVolume[eid] = LocalAudioAnalyser.volume[eid];
      LocalAudioAnalyser.volume[eid] = newVolume;
    } else {
      LocalAudioAnalyser.prevVolume[eid] = LocalAudioAnalyser.volume[eid];
      LocalAudioAnalyser.volume[eid] = 0;
    }
  });
}
