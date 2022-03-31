import {
  AudioType,
  SourceType,
  MediaAudioDefaults,
  AvatarAudioDefaults,
  TargetAudioDefaults
} from "./components/audio-params";
import { isSafari } from "./utils/detect-safari";

const defaultSettingsForSourceType = Object.freeze(
  new Map([
    [SourceType.MEDIA_VIDEO, MediaAudioDefaults],
    [SourceType.AVATAR_AUDIO_SOURCE, AvatarAudioDefaults],
    [SourceType.AUDIO_TARGET, TargetAudioDefaults]
  ])
);

function applySettings(audio, settings) {
  if (audio.panner) {
    audio.setDistanceModel(settings.distanceModel);
    audio.setRolloffFactor(settings.rolloffFactor);
    audio.setRefDistance(settings.refDistance);
    audio.setMaxDistance(settings.maxDistance);
    audio.panner.coneInnerAngle = settings.coneInnerAngle;
    audio.panner.coneOuterAngle = settings.coneOuterAngle;
    audio.panner.coneOuterGain = settings.coneOuterGain;
  }
  audio.gain.gain.setTargetAtTime(settings.gain, audio.context.currentTime, 0.1);
}

export function getCurrentAudioSettings(el) {
  const sourceType = APP.sourceType.get(el);
  const defaults = defaultSettingsForSourceType.get(sourceType);
  const sceneOverrides = APP.sceneAudioDefaults.get(sourceType);
  const audioOverrides = APP.audioOverrides.get(el);
  const audioDebugPanelOverrides = APP.audioDebugPanelOverrides.get(sourceType);
  const zoneSettings = APP.zoneOverrides.get(el);
  const preferencesOverrides =
    APP.store.state.preferences.audioOutputMode === "audio" ? { audioType: AudioType.Stereo } : {};
  const safariOverrides = isSafari() ? { audioType: AudioType.Stereo } : {};
  const settings = Object.assign(
    {},
    defaults,
    sceneOverrides,
    audioOverrides,
    audioDebugPanelOverrides,
    zoneSettings,
    preferencesOverrides,
    safariOverrides
  );

  if (APP.clippingState.has(el) || APP.linkedMutedState.has(el)) {
    settings.gain = 0;
  } else if (APP.gainMultipliers.has(el)) {
    settings.gain = settings.gain * APP.gainMultipliers.get(el);
  }

  if (APP.supplementaryAttenuation.has(el)) {
    settings.gain = settings.gain * APP.supplementaryAttenuation.get(el);
  }

  return settings;
}

export function getCurrentAudioSettingsForSourceType(sourceType) {
  const defaults = defaultSettingsForSourceType.get(sourceType);
  const sceneOverrides = APP.sceneAudioDefaults.get(sourceType);
  const audioDebugPanelOverrides = APP.audioDebugPanelOverrides.get(sourceType);
  return Object.assign({}, defaults, sceneOverrides, audioDebugPanelOverrides);
}

export function updateAudioSettings(el, audio) {
  // Follow these rules and you'll have a good time:
  // - If a THREE.Audio or THREE.PositionalAudio is created, call this function.
  // - If audio settings change, call this function.
  applySettings(audio, getCurrentAudioSettings(el));
}

export function shouldAddSupplementaryAttenuation(el, audio) {
  // Never add supplemental attenuation to audios that have a panner node;
  // The panner node adds its own attenuation.
  if (audio.panner) return false;

  // This function must distinguish between Audios that are "incidentally"
  // not PositionalAudios from Audios that are "purposefully" not PositionalAudios:
  // - An audio is "incidentally" non-positional if it only non-positional
  //     because the audioOutputMode pref is set to "audio", or
  //     because panner nodes are broken on a particular platform, or
  //     because of something else like that.
  // - An audio is "purposefully" non-positional if it was authored to be
  //     a "background sound" or otherwise made that way "on purpose".
  //
  // Authoring tools like Spoke create components where "audioType : stereo"
  // is used to indicate that audio should play in the background without
  // left/right panning and without distance-based attenuation.
  //
  // Those components also include properties like distanceModel, rolloffFactor, etc,
  // but these properties were assumed to be ignored by the client.
  // Thus we cannot simply apply the attenuation values we would get if we calculated
  // attenuation with the provided distanceModel, rolloffFactor, etc.
  //
  // Instead, we determine what the audioType would be if it were not for the
  // "incidental" factors. In particular, we check if the audioType would have
  // been PannerNode if we ignored the overrides due to audioOutputMode and platform
  // problems (e.g. Safari).
  //
  // If the audioType would have been PannerNode, then we should apply "fake",
  // "supplementary" attenuation. Otherwise, the audio is purposefully a
  // "background sound" and we should not apply supplementary attenuation.
  const sourceType = APP.sourceType.get(el);
  const defaults = defaultSettingsForSourceType.get(sourceType);
  const sceneOverrides = APP.sceneAudioDefaults.get(sourceType);
  const audioDebugPanelOverrides = APP.audioDebugPanelOverrides.get(sourceType);
  const audioOverrides = APP.audioOverrides.get(el);
  const zoneSettings = APP.zoneOverrides.get(el);
  const settings = Object.assign({}, defaults, sceneOverrides, audioDebugPanelOverrides, audioOverrides, zoneSettings);
  return settings.audioType === AudioType.PannerNode;
}
