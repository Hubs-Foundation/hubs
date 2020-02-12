function updateMediaAudioSettings(audio, settings) {
  audio.setDistanceModel(settings.mediaDistanceModel);
  audio.setRolloffFactor(settings.mediaRolloffFactor);
  audio.setRefDistance(settings.mediaRefDistance);
  audio.setMaxDistance(settings.mediaMaxDistance);
  audio.panner.coneInnerAngle = settings.mediaConeInnerAngle;
  audio.panner.coneOuterAngle = settings.mediaConeOuterAngle;
  audio.panner.coneOuterGain = settings.mediaConeOuterGain;
}

function updateAvatarAudioSettings(audio, settings) {
  audio.setDistanceModel(settings.avatarDistanceModel);
  audio.setRolloffFactor(settings.avatarRolloffFactor);
  audio.setRefDistance(settings.avatarRefDistance);
  audio.setMaxDistance(settings.avatarMaxDistance);
}

export class SceneAudioSettingsSystem {
  constructor(sceneEl) {
    this.sceneEl = sceneEl;
    this.defaultSettings = {
      avatarDistanceModel: "inverse",
      avatarRolloffFactor: 2,
      avatarRefDistance: 1,
      avatarMaxDistance: 10000,
      mediaVolume: 0.5,
      mediaDistanceModel: "inverse",
      mediaRolloffFactor: 1,
      mediaRefDistance: 1,
      mediaMaxDistance: 10000,
      mediaConeInnerAngle: 360,
      mediaConeOuterAngle: 0,
      mediaConeOuterGain: 0
    };
    this.sceneAudioSettings = this.defaultSettings;
    this.mediaAudioSources = [];
    this.avatarAudioSources = [];

    this.sceneEl.addEventListener("reset_scene", this.onSceneReset);
  }

  registerMediaAudioSource(audioSource) {
    this.mediaAudioSources.push(audioSource);
    updateMediaAudioSettings(audioSource, this.sceneAudioSettings);
  }

  unregisterMediaAudioSource(audioSource) {
    this.mediaAudioSources.splice(this.mediaAudioSources.indexOf(audioSource, 1));
  }

  registerAvatarAudioSource(audioSource) {
    this.avatarAudioSources.push(audioSource);
    updateAvatarAudioSettings(audioSource, this.sceneAudioSettings);
  }

  unregisterAvatarAudioSource(audioSource) {
    this.avatarAudioSources.splice(this.avatarAudioSources.indexOf(audioSource, 1));
  }

  updateSceneAudioSettings(settings) {
    this.sceneAudioSettings = Object.assign({}, this.defaultSettings, settings);

    for (const mediaAudioSource of this.mediaAudioSources) {
      updateMediaAudioSettings(mediaAudioSource, settings);
    }

    for (const avatarAudioSource of this.avatarAudioSources) {
      updateAvatarAudioSettings(avatarAudioSource, settings);
    }
  }

  onSceneReset = () => {
    this.updateSceneAudioSettings(this.defaultSettings);
  };
}
