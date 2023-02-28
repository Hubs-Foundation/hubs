import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { HubsWorld } from "../app";
import { AvatarAudioSource, NetworkAudioAnalyser, NetworkedAvatar } from "../bit-components";
import {
  DISABLE_AT_VOLUME_THRESHOLD,
  DISABLE_GRACE_PERIOD_MS,
  IS_TALKING_THRESHOLD_MS,
  updateVolume
} from "../utils/avatar-audio-utils";
import { findAncestorWithComponent, findChildWithComponent } from "../utils/bit-utils";
import { AudioObject3D, Emitter2Audio } from "./audio-emitter-system";

export const NETWORKED_AUDIO_ANALYSER_FLAGS = {
  DISABLE_UPDATES: 1 << 0,
  AVATAR_IS_TALKING: 1 << 1
};

type NetworkedAudioAnalyserData = {
  analyser: AnalyserNode;
  levels: Uint8Array;
  audioEid: number;
};

const tryAddAnalyserData = (networkedAudioAnalyserEid: number, avatarAudioSourceEid: number) => {
  const audioEid = Emitter2Audio.get(avatarAudioSourceEid);
  if (!analyserData.has(networkedAudioAnalyserEid) && audioEid) {
    const audio = APP.world.eid2obj.get(audioEid) as AudioObject3D;
    const ctx = APP.audioListener.context;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 32;
    audio.getOutput().connect(analyser);
    const levels = new Uint8Array(analyser.fftSize);
    analyserData.set(networkedAudioAnalyserEid, { analyser, levels, audioEid });
  }
};

const analyserData = new Map<number, NetworkedAudioAnalyserData>();
let currIdx = 0;

const networkedAudioAnalyserQuery = defineQuery([NetworkAudioAnalyser]);
const networkedAudioAnalyserEnterQuery = enterQuery(networkedAudioAnalyserQuery);
const networkedAudioAnalyserExitQuery = exitQuery(networkedAudioAnalyserQuery);
const avatarAudioSourceQuery = defineQuery([AvatarAudioSource]);
const avatarAudioSourceEnterQuery = enterQuery(avatarAudioSourceQuery);
export function networkAudioAnalyserSystem(world: HubsWorld) {
  avatarAudioSourceEnterQuery(world).forEach(eid => {
    const networkedAvatarEid = findAncestorWithComponent(world, NetworkedAvatar, eid)!;
    const networkedAudioAnalyserEid = findChildWithComponent(world, NetworkAudioAnalyser, networkedAvatarEid)!;
    networkedAudioAnalyserEid && tryAddAnalyserData(networkedAudioAnalyserEid, eid);
  });
  networkedAudioAnalyserEnterQuery(world).forEach(eid => {
    const networkedAvatarEid = findAncestorWithComponent(world, NetworkedAvatar, eid)!;
    const avatarAudioSourceEid = findChildWithComponent(world, AvatarAudioSource, networkedAvatarEid);
    avatarAudioSourceEid && tryAddAnalyserData(eid, avatarAudioSourceEid);
  });
  networkedAudioAnalyserExitQuery(world).forEach(eid => {
    if (analyserData.has(eid)) {
      const { analyser, audioEid } = analyserData.get(eid)!;
      const audio = world.eid2obj.get(audioEid) as AudioObject3D;
      audio.getOutput().disconnect(analyser);
      analyserData.delete(eid);
    }
  });
  const networkedAudioAnalysers = networkedAudioAnalyserQuery(world);
  networkedAudioAnalysers.forEach((eid: number, idx: number) => {
    if (!analyserData.has(eid)) return;
    if (NetworkAudioAnalyser.flags[eid] & NETWORKED_AUDIO_ANALYSER_FLAGS.DISABLE_UPDATES && idx !== currIdx) return;

    const data = analyserData.get(eid)!;
    const newVolume = updateVolume({
      analyser: data.analyser,
      levels: data.levels,
      volume: NetworkAudioAnalyser.volume[eid],
      prevVolume: NetworkAudioAnalyser.prevVolume[eid]
    });
    NetworkAudioAnalyser.prevVolume[eid] = NetworkAudioAnalyser.volume[eid];
    NetworkAudioAnalyser.volume[eid] = newVolume;

    const t = world.time.elapsed;
    if (newVolume < DISABLE_AT_VOLUME_THRESHOLD) {
      const lastSeenVolume = NetworkAudioAnalyser.lastSeenVolume[eid];
      if (t && lastSeenVolume && lastSeenVolume < t - DISABLE_GRACE_PERIOD_MS) {
        NetworkAudioAnalyser.flags[eid] |= NETWORKED_AUDIO_ANALYSER_FLAGS.DISABLE_UPDATES;
      }
      if (t && lastSeenVolume && lastSeenVolume < t - IS_TALKING_THRESHOLD_MS) {
        NetworkAudioAnalyser.flags[eid] &= ~NETWORKED_AUDIO_ANALYSER_FLAGS.AVATAR_IS_TALKING;
      }
    } else {
      if (t) {
        NetworkAudioAnalyser.lastSeenVolume[eid] = t;
      }

      NetworkAudioAnalyser.flags[eid] &= ~NETWORKED_AUDIO_ANALYSER_FLAGS.DISABLE_UPDATES;
      NetworkAudioAnalyser.flags[eid] |= NETWORKED_AUDIO_ANALYSER_FLAGS.AVATAR_IS_TALKING;
    }
  });
  currIdx = currIdx >= networkedAudioAnalysers.length ? 0 : currIdx + 1;
}
