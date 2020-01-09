import { SOUND_MEDIA_LOADING } from "../systems/sound-effects-system";

AFRAME.registerComponent("refresh-media-button", {
  init() {
    this.onClick = async () => {
      const sfx = this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem;

      if (this.targetEl) {
        this.targetEl.components["media-loader"].refresh();

        // Hide button + do the sound effect here, so only the person who clicked hears it, not everyone.
        this.el.object3D.visible = false;
        const loadingSoundEffect = sfx.playPositionalSoundFollowing(SOUND_MEDIA_LOADING, this.targetEl.object3D, true);

        this.targetEl.addEventListener(
          "media_refreshed",
          () => {
            sfx.stopPositionalAudio(loadingSoundEffect);
            this.el.object3D.visible = true;
          },
          { once: true }
        );
      }
    };

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
