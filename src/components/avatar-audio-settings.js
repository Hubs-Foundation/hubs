AFRAME.registerComponent("avatar-audio-settings", {
  init() {
    this.el.addEventListener("sound-source-set", () => {
      const networkedAudioSource = this.el.components["networked-audio-source"];

      if (networkedAudioSource) {
        this.el.sceneEl.systems["hubs-systems"].sceneAudioSettingsSystem.registerAvatarAudioSource(
          networkedAudioSource.sound
        );
      }
    });
  },

  remove() {
    const networkedAudioSource = this.el.components["networked-audio-source"];

    if (networkedAudioSource) {
      this.el.sceneEl.systems["hubs-systems"].sceneAudioSettingsSystem.unregisterAvatarAudioSource(
        networkedAudioSource.sound
      );
    }
  }
});
