function updateMediaAudioSettings(audio, settings) {
  if (audio.setDistanceModel) {
    audio.setDistanceModel(settings.mediaDistanceModel);
    audio.setRolloffFactor(settings.mediaRolloffFactor);
    audio.setRefDistance(settings.mediaRefDistance);
    audio.setMaxDistance(settings.mediaMaxDistance);
  }
  if (audio.panner) {
    audio.panner.coneInnerAngle = settings.mediaConeInnerAngle;
    audio.panner.coneOuterAngle = settings.mediaConeOuterAngle;
    audio.panner.coneOuterGain = settings.mediaConeOuterGain;
  }
}

function updateAvatarAudioSettings(audio, settings) {
  if (audio.setDistanceModel) {
    audio.setDistanceModel(settings.avatarDistanceModel);
    audio.setRolloffFactor(settings.avatarRolloffFactor);
    audio.setRefDistance(settings.avatarRefDistance);
    audio.setMaxDistance(settings.avatarMaxDistance);
  }
}

export class AudioSettingsSystem {
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
    this.audioSettings = this.defaultSettings;
    this.mediaAudioSources = [];
    this.avatarAudioSources = [];

    this.sceneEl.addEventListener("reset_scene", this.onSceneReset);

    if (window.APP.store.state.preferences.audioOutputMode === "audio") {
      window.APP.store.state.preferences.audioOutputMode = "panner"; //hack to always reset to "panner"
    }
  }

  registerMediaAudioSource(audioSource) {
    this.mediaAudioSources.push(audioSource);
    updateMediaAudioSettings(audioSource, this.audioSettings);
  }

  unregisterMediaAudioSource(audioSource) {
    this.mediaAudioSources.splice(this.mediaAudioSources.indexOf(audioSource, 1));
  }

  registerAvatarAudioSource(audioSource) {
    this.avatarAudioSources.push(audioSource);
    updateAvatarAudioSettings(audioSource, this.audioSettings);
  }

  unregisterAvatarAudioSource(audioSource) {
    this.avatarAudioSources.splice(this.avatarAudioSources.indexOf(audioSource, 1));
  }

  updateAudioSettings(settings) {
    this.audioSettings = Object.assign({}, this.defaultSettings, settings);

    for (const mediaAudioSource of this.mediaAudioSources) {
      updateMediaAudioSettings(mediaAudioSource, settings);
    }

    for (const avatarAudioSource of this.avatarAudioSources) {
      updateAvatarAudioSettings(avatarAudioSource, settings);
    }
  }

  onSceneReset = () => {
    this.updateAudioSettings(this.defaultSettings);
  };
}

AFRAME.registerComponent("audio-source", {
  schema: {
    type: { type: "string" } // avatar, media
  },

  init() {
    this.audioSource = null;

    if (this.data.type === "avatar") {
      this.onSoundSourceSet = this.onSoundSourceSet.bind(this);
      this.el.addEventListener("sound-source-set", this.onSoundSourceSet);
    } else if (this.data.type === "media") {
      this.onVideoLoaded = this.onVideoLoaded.bind(this);
      this.el.addEventListener("video-loaded", this.onVideoLoaded);
    }
  },

  tick: function() {
    const networkedAudioSource = this.el.components["networked-audio-source"];
    if (networkedAudioSource) {
      const audioOutputMode = window.APP.store.state.preferences.audioOutputMode === "audio" ? "audio" : "panner";
      if (
        (audioOutputMode === "panner" && !networkedAudioSource.data.positional) ||
        (audioOutputMode === "audio" && networkedAudioSource.data.positional)
      ) {
        networkedAudioSource.data.positional = audioOutputMode === "panner" ? true : false;
        networkedAudioSource.sound.disconnect();
        networkedAudioSource.setupSound();
        const soundSource = networkedAudioSource.sound.context.createMediaStreamSource(networkedAudioSource.stream);
        networkedAudioSource.sound.setNodeSource(soundSource);
        networkedAudioSource.el.emit("sound-source-set", { soundSource });
      }
    }
  },

  onSoundSourceSet() {
    const audioSettingsSystem = this.el.sceneEl.systems["hubs-systems"].audioSettingsSystem;
    const networkedAudioSource = this.el.components["networked-audio-source"];

    if (this.audioSource) {
      audioSettingsSystem.unregisterAvatarAudioSource(this.audioSource);
    }

    if (networkedAudioSource) {
      this.audioSource = networkedAudioSource.sound;
      audioSettingsSystem.registerAvatarAudioSource(this.audioSource);
    }
  },

  onVideoLoaded() {
    const audioSettingsSystem = this.el.sceneEl.systems["hubs-systems"].audioSettingsSystem;
    const mediaVideo = this.el.components["media-video"];

    if (this.audioSource) {
      audioSettingsSystem.unregisterMediaAudioSource(this.audioSource);
    }

    if (mediaVideo && mediaVideo.audio) {
      this.audioSource = mediaVideo.audio;
      audioSettingsSystem.registerMediaAudioSource(this.audioSource);
    }
  },

  remove() {
    if (!this.audioSource) {
      return;
    }

    const audioSettingsSystem = this.el.sceneEl.systems["hubs-systems"].audioSettingsSystem;

    if (this.data.type === "avatar") {
      audioSettingsSystem.unregisterAvatarAudioSource(this.audioSource);
      this.el.removeEventListener("sound-source-set", this.onSoundSourceSet);
    } else if (this.data.type === "media") {
      audioSettingsSystem.unregisterMediaAudioSource(this.audioSource);
      this.el.removeEventListener("video-loaded", this.onVideoLoaded);
    }
  }
});
