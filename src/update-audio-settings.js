import { addComponent } from "bitecs";
import { AudioSettingsChanged } from "./bit-components";
import {
  SourceType,
  PanningModelType,
  MediaAudioDefaults,
  AvatarAudioDefaults,
  TargetAudioDefaults,
  AudioType
} from "./components/audio-params";
import { isPositionalAudio, swapAudioType, updatePannerNode } from "./bit-systems/audio-emitter-system";

const defaultSettingsForSourceType = Object.freeze(
  new Map([
    [SourceType.MEDIA_VIDEO, MediaAudioDefaults],
    [SourceType.AVATAR_AUDIO_SOURCE, AvatarAudioDefaults],
    [SourceType.AUDIO_TARGET, TargetAudioDefaults]
  ])
);

export function applySettings(elOrEid, settings) {
  const audio = APP.audios.get(elOrEid);
  if (isPositionalAudio(audio)) {
    audio.distanceModel = settings.distanceModel;
    audio.rolloffFactor = settings.rolloffFactor;
    audio.refDistance = settings.refDistance;
    audio.maxDistance = settings.maxDistance;
    audio.panningModel = settings.panningModel;
    audio.coneInnerAngle = settings.coneInnerAngle;
    audio.coneOuterAngle = settings.coneOuterAngle;
    audio.coneOuterGain = settings.coneOuterGain;
  }
  const gain = APP.gains.get(elOrEid);
  gain.gain.setTargetAtTime(settings.gain, audio.context.currentTime, 0.1);
}

export function getOverriddenPanningModelType() {
  switch (APP.store.state.preferences.audioPanningQuality) {
    case "High":
      return PanningModelType.HRTF;
    case "Low":
      return PanningModelType.EqualPower;
    default:
      return null;
  }
}

export function getCurrentAudioSettings(el) {
  const sourceType = APP.sourceType.get(el);
  const defaults = defaultSettingsForSourceType.get(sourceType);
  const sceneOverrides = APP.sceneAudioDefaults.get(sourceType);
  const audioOverrides = APP.audioOverrides.get(el);
  const audioDebugPanelOverrides = APP.audioDebugPanelOverrides.get(sourceType);
  const zoneSettings = APP.zoneOverrides.get(el);
  const preferencesOverrides = {};

  const overriddenPanningModelType = getOverriddenPanningModelType();
  const isNonModeratorAvatarAudio = sourceType === SourceType.AVATAR_AUDIO_SOURCE && !APP.moderatorAudioSource.has(el);

  if (overriddenPanningModelType !== null) {
    preferencesOverrides.panningModel = overriddenPanningModelType;
  }

  if (APP.store.state.preferences.disableLeftRightPanning) {
    preferencesOverrides.audioType = AudioType.Stereo;
  }

  const settings = Object.assign(
    {},
    defaults,
    sceneOverrides,
    audioOverrides,
    audioDebugPanelOverrides,
    zoneSettings,
    preferencesOverrides
  );

  if (
    APP.clippingState.has(el) ||
    APP.mutedState.has(el) ||
    (isNonModeratorAvatarAudio && !APP.hub.member_permissions?.voice_chat)
  ) {
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

// Follow these rules and you'll have a good time:
// - If a PannerNode or Stereo audio is created, call this function.
// - If audio settings change, call this function.
export function updateAudioSettings(elOrEid, audio) {
  if (!elOrEid.isEntity) {
    const eid = elOrEid;
    addComponent(APP.world, AudioSettingsChanged, eid);
  } else {
    const el = elOrEid;
    const settings = getCurrentAudioSettings(el);
    if (
      (!isPositionalAudio(audio) && settings.audioType === AudioType.PannerNode) ||
      (isPositionalAudio(audio) && settings.audioType === AudioType.Stereo)
    ) {
      swapAudioType(elOrEid);
      audio = APP.audios.get(elOrEid);
      if (isPositionalAudio(audio)) {
        const obj = APP.world.eid2obj.get(elOrEid.eid);
        updatePannerNode(audio, obj);
      }
    }
    applySettings(elOrEid, settings);
  }
}

export function shouldAddSupplementaryAttenuation(el, audio) {
  // Never add supplemental attenuation to audios that have a panner node;
  // The panner node adds its own attenuation.
  if (isPositionalAudio(audio)) return false;

  // This function must distinguish between Audios that are "incidentally"
  // not PositionalAudios from Audios that are "purposefully" not PositionalAudios:
  // - An audio is "incidentally" non-positional if it only non-positional
  //     because the disableLeftRightPanning pref is set to true, or
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
  // been PannerNode if we ignored the overrides due to disableLeftRightPanning and platform
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
