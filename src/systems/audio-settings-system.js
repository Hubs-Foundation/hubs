import { SourceType, AvatarAudioDefaults, MediaAudioDefaults } from "../components/audio-params";
import { updateAudioSettings } from "../update-audio-settings";

export class AudioSettingsSystem {
  constructor(sceneEl) {
    this.sceneEl = sceneEl;
    // TODO: Clean this up
    this.defaultSettings = {
      avatarDistanceModel: AvatarAudioDefaults.distanceModel,
      avatarRolloffFactor: AvatarAudioDefaults.rolloffFactor,
      avatarRefDistance: AvatarAudioDefaults.refDistance,
      avatarMaxDistance: AvatarAudioDefaults.maxDistance,
      avatarConeInnerAngle: AvatarAudioDefaults.coneInnerAngle,
      avatarConeOuterAngle: AvatarAudioDefaults.coneOuterAngle,
      avatarConeOuterGain: AvatarAudioDefaults.coneOuterGain,
      mediaVolume: MediaAudioDefaults.VOLUME,
      mediaDistanceModel: MediaAudioDefaults.distanceModel,
      mediaRolloffFactor: MediaAudioDefaults.rolloffFactor,
      mediaRefDistance: MediaAudioDefaults.refDistance,
      mediaMaxDistance: MediaAudioDefaults.maxDistance,
      mediaConeInnerAngle: MediaAudioDefaults.coneInnerAngle,
      mediaConeOuterAngle: MediaAudioDefaults.coneOuterAngle,
      mediaConeOuterGain: MediaAudioDefaults.coneOuterGain
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
  }

  unregisterMediaAudioSource(mediaVideo) {
    this.mediaVideos.splice(this.mediaVideos.indexOf(mediaVideo), 1);
  }

  registerAvatarAudioSource(avatarAudioSource) {
    const index = this.avatarAudioSources.indexOf(avatarAudioSource);
    if (index === -1) {
      this.avatarAudioSources.push(avatarAudioSource);
    }
  }

  unregisterAvatarAudioSource(avatarAudioSource) {
    const index = this.avatarAudioSources.indexOf(avatarAudioSource);
    if (index !== -1) {
      this.avatarAudioSources.splice(index, 1);
    }
  }

  updateAudioSettings(settings) {
    APP.sceneAudioDefaults.set(SourceType.MEDIA_VIDEO, {
      distanceModel: settings.mediaDistanceModel,
      rolloffFactor: settings.mediaRolloffFactor,
      refDistance: settings.mediaRefDistance,
      maxDistance: settings.mediaMaxDistance,
      coneInnerAngle: settings.mediaConeInnerAngle,
      coneOuterAngle: settings.mediaConeOuterAngle,
      coneOuterGain: settings.mediaConeOuterGain,
      VOLUME: settings.mediaVolume
    });
    APP.sceneAudioDefaults.set(SourceType.AVATAR_AUDIO_SOURCE, {
      distanceModel: settings.avatarDistanceModel,
      rolloffFactor: settings.avatarRolloffFactor,
      refDistance: settings.avatarRefDistance,
      maxDistance: settings.avatarMaxDistance,
      coneInnerAngle: settings.avatarConeInnerAngle,
      coneOuterAngle: settings.avatarConeOuterAngle,
      coneOuterGain: settings.avatarConeOuterGain,
      VOLUME: settings.avatarVolume
    });

    // TODO: Clean this up. Should not need it anymore
    this.audioSettings = Object.assign({}, this.defaultSettings, settings);

    // TODO: Loop over all the audios in the scene. It's simpler and we can remove this
    // book keeping code
    for (const mediaVideo of this.mediaVideos) {
      // TODO: Rename this function. Very confusing. This is NOT the member function it's in.
      const audio = APP.audios.get(mediaVideo.el);
      if (audio) {
        updateAudioSettings(mediaVideo.el, audio);
      }
    }

    for (const avatarAudioSource of this.avatarAudioSources) {
      // TODO: Rename this function. Very confusing. This is NOT the member function it's in.
      const audio = APP.audios.get(avatarAudioSource.el);
      if (audio) {
        updateAudioSettings(avatarAudioSource.el, audio);
      }
    }
  }

  onSceneReset = () => {
    APP.sceneAudioDefaults.delete(SourceType.AVATAR_AUDIO_SOURCE);
    APP.sceneAudioDefaults.delete(SourceType.MEDIA_VIDEO);
    // TODO: update all the audios in the app
    for (const mediaVideo of this.mediaVideos) {
      // TODO: Rename this function. Very confusing. This is NOT the member function it's in.
      const audio = APP.audios.get(mediaVideo.el);
      if (audio) {
        updateAudioSettings(mediaVideo.el, audio);
      }
    }

    for (const avatarAudioSource of this.avatarAudioSources) {
      // TODO: Rename this function. Very confusing. This is NOT the member function it's in.
      const audio = APP.audios.get(avatarAudioSource.el);
      if (audio) {
        updateAudioSettings(avatarAudioSource.el, audio);
      }
    }
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
