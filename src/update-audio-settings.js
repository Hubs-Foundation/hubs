import { SourceType, MediaAudioDefaults, AvatarAudioDefaults, TargetAudioDefaults } from "./components/audio-params";

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

  // TODO: Apply gain
}

const defaultSettingsForSourceType = new Map([
  [SourceType.MEDIA_VIDEO, MediaAudioDefaults],
  [SourceType.AVATAR_AUDIO_SOURCE, AvatarAudioDefaults],
  [SourceType.AUDIO_TARGET, TargetAudioDefaults]
]);

export function getCurrentAudioSettings(el) {
  // -- Highest Precedence --
  //
  //  DEBUG PANEL
  //  AUDIO ZONE
  //  PER-OBJECT OVERRIDES
  //  SCENE OVERRIDES
  //  APP DEFAULTS
  //
  // -- Lowest Precedence --

  // TODO: Add the DEBUG PANEL settings.
  // TODO: The DEBUG PANEL only wants to set a few settings at a time
  // TODO: Perhaps AUDIO ZONEs should be allowed to affect only a few settings at a time

  const zoneSettings = APP.zoneOverrides.get(el);
  if (zoneSettings) {
    return zoneSettings;
  }

  const audioOverrides = APP.audioOverrides.get(el);
  if (audioOverrides) {
    return audioOverrides;
  }

  const sourceType = APP.sourceType.get(el);
  if (sourceType !== undefined) {
    const sceneOverrides = APP.sceneAudioDefaults.get(sourceType);
    if (sceneOverrides) {
      return sceneOverrides;
    }

    const defaults = defaultSettingsForSourceType.get(sourceType);
    if (defaults) {
      return defaults;
    }
  }
  return null;
}

// TODO: Change this name or the name of the function on audio-settings-system
export function updateAudioSettings(el, audio) {
  // Follow these rules and you'll have a good time:
  // - If a THREE.Audio or THREE.PositionalAudio is created, call this function.
  // - If you audio settings change, call this function.
  const settings = getCurrentAudioSettings(el);
  if (settings) {
    applySettings(audio, settings);
    return;
  }

  console.error("Uh oh! Had no settings to apply", el, audio);
}
