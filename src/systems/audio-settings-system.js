export const AvatarAudioDefaults = Object.freeze({
  DISTANCE_MODEL: "inverse",
  ROLLOFF_FACTOR: 2,
  REF_DISTANCE: 1,
  MAX_DISTANCE: 10000,
  INNER_ANGLE: 180,
  OUTER_ANGLE: 360,
  OUTER_GAIN: 0,
  VOLUME: 0.5
});

export const MediaAudioDefaults = Object.freeze({
  DISTANCE_MODEL: "inverse",
  ROLLOFF_FACTOR: 1,
  REF_DISTANCE: 1,
  MAX_DISTANCE: 10000,
  INNER_ANGLE: 360,
  OUTER_ANGLE: 0,
  OUTER_GAIN: 0,
  VOLUME: 0.5
});

export const TargetAudioDefaults = Object.freeze({
  DISTANCE_MODEL: "inverse",
  ROLLOFF_FACTOR: 5,
  REF_DISTANCE: 8,
  MAX_DISTANCE: 10000,
  INNER_ANGLE: 170,
  OUTER_ANGLE: 300,
  OUTER_GAIN: 0.3,
  VOLUME: 1.0
});

export const DISTANCE_MODEL_OPTIONS = ["linear", "inverse", "exponential"];

function updateMediaAudioSettings(mediaVideo, settings) {
  mediaVideo.el.setAttribute("media-video", {
    distanceModel: settings.mediaDistanceModel,
    rolloffFactor: settings.mediaRolloffFactor,
    refDistance: settings.mediaRefDistance,
    maxDistance: settings.mediaMaxDistance,
    coneInnerAngle: settings.mediaConeInnerAngle,
    coneOuterAngle: settings.mediaConeOuterAngle,
    coneOuterGain: settings.mediaConeOuterGain
  });
}

function updateAvatarAudioSettings(avatarAudioSource, settings, positional) {
  avatarAudioSource.el.setAttribute("avatar-audio-source", {
    positional,
    distanceModel: settings.avatarDistanceModel,
    maxDistance: settings.avatarMaxDistance,
    refDistance: settings.avatarRefDistance,
    rolloffFactor: settings.avatarRolloffFactor,
    innerAngle: settings.avatarConeInnerAngle,
    outerAngle: settings.avatarConeOuterAngle,
    outerGain: settings.avatarConeOuterGain
  });
}

export class AudioSettingsSystem {
  constructor(sceneEl) {
    this.sceneEl = sceneEl;
    this.defaultSettings = {
      avatarDistanceModel: AvatarAudioDefaults.DISTANCE_MODEL,
      avatarRolloffFactor: AvatarAudioDefaults.ROLLOFF_FACTOR,
      avatarRefDistance: AvatarAudioDefaults.REF_DISTANCE,
      avatarMaxDistance: AvatarAudioDefaults.MAX_DISTANCE,
      avatarConeInnerAngle: AvatarAudioDefaults.INNER_ANGLE,
      avatarConeOuterAngle: AvatarAudioDefaults.OUTER_ANGLE,
      avatarConeOuterGain: AvatarAudioDefaults.OUTER_GAIN,
      mediaVolume: MediaAudioDefaults.VOLUME,
      mediaDistanceModel: AvatarAudioDefaults.DISTANCE_MODEL,
      mediaRolloffFactor: AvatarAudioDefaults.ROLLOFF_FACTOR,
      mediaRefDistance: AvatarAudioDefaults.REF_DISTANCE,
      mediaMaxDistance: AvatarAudioDefaults.MAX_DISTANCE,
      mediaConeInnerAngle: AvatarAudioDefaults.INNER_ANGLE,
      mediaConeOuterAngle: AvatarAudioDefaults.OUTER_ANGLE,
      mediaConeOuterGain: AvatarAudioDefaults.OUTER_GAIN
    };
    this.audioSettings = this.defaultSettings;
    this.mediaVideos = [];
    this.avatarAudioSources = [];

    this.sceneEl.addEventListener("reset_scene", this.onSceneReset);

    if (
      !window.APP.store.state.preferences.audioOutputMode ||
      window.APP.store.state.preferences.audioOutputMode === "audio"
    ) {
      //hack to always reset to "panner"
      window.APP.store.update({
        preferences: { audioOutputMode: "panner" }
      });
    }
    if (window.APP.store.state.preferences.audioNormalization !== 0.0) {
      //hack to always reset to 0.0 (disabled)
      window.APP.store.update({
        preferences: { audioNormalization: 0.0 }
      });
    }

    this.audioOutputMode = window.APP.store.state.preferences.audioOutputMode;
    this.onPreferenceChanged = () => {
      const newPref = window.APP.store.state.preferences.audioOutputMode;
      const shouldUpdateAudioSettings = this.audioOutputMode !== newPref;
      this.audioOutputMode = newPref;
      if (shouldUpdateAudioSettings) {
        this.updateAudioSettings(this.audioSettings);
      }
    };
    window.APP.store.addEventListener("statechanged", this.onPreferenceChanged);
  }

  registerMediaAudioSource(mediaVideo) {
    const index = this.mediaVideos.indexOf(mediaVideo);
    if (index === -1) {
      this.mediaVideos.push(mediaVideo);
    }
    updateMediaAudioSettings(mediaVideo, this.audioSettings);
  }

  unregisterMediaAudioSource(mediaVideo) {
    this.mediaVideos.splice(this.mediaVideos.indexOf(mediaVideo), 1);
  }

  registerAvatarAudioSource(avatarAudioSource) {
    const index = this.avatarAudioSources.indexOf(avatarAudioSource);
    if (index === -1) {
      this.avatarAudioSources.push(avatarAudioSource);
    }
    const positional = window.APP.store.state.preferences.audioOutputMode !== "audio";
    updateAvatarAudioSettings(avatarAudioSource, this.audioSettings, positional);
  }

  unregisterAvatarAudioSource(avatarAudioSource) {
    const index = this.avatarAudioSources.indexOf(avatarAudioSource);
    if (index !== -1) {
      this.avatarAudioSources.splice(index, 1);
    }
  }

  updateAudioSettings(settings) {
    this.audioSettings = Object.assign({}, this.defaultSettings, settings);

    for (const mediaVideo of this.mediaVideos) {
      updateMediaAudioSettings(mediaVideo, settings);
    }

    const positional = window.APP.store.state.preferences.audioOutputMode !== "audio";
    for (const avatarAudioSource of this.avatarAudioSources) {
      updateAvatarAudioSettings(avatarAudioSource, settings, positional);
    }
  }

  onSceneReset = () => {
    this.updateAudioSettings(this.defaultSettings);
  };
}

AFRAME.registerComponent("use-audio-system-settings", {
  init() {
    this.onVideoLoaded = this.onVideoLoaded.bind(this);
    this.el.addEventListener("video-loaded", this.onVideoLoaded);
  },

  onVideoLoaded() {
    const audioSettingsSystem = this.el.sceneEl.systems["hubs-systems"].audioSettingsSystem;
    if (this.mediaVideo) {
      audioSettingsSystem.unregisterMediaAudioSource(this.mediaVideo);
    }
    this.mediaVideo = this.el.components["media-video"];
    audioSettingsSystem.registerMediaAudioSource(this.mediaVideo);
  },

  remove() {
    const audioSettingsSystem = this.el.sceneEl.systems["hubs-systems"].audioSettingsSystem;
    if (this.mediaVideo) {
      audioSettingsSystem.unregisterMediaAudioSource(this.mediaVideo);
    }
    this.el.removeEventListener("video-loaded", this.onVideoLoaded);
  }
});
