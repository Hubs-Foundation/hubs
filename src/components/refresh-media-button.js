import { SOUND_MEDIA_LOADING } from "../systems/sound-effects-system";

AFRAME.registerComponent("local-refresh-media-button", {
  init() {
    this.onClick = async () => {
      if (this.targetEl) {
        const c = this.targetEl.components;
        // If an HLS stream is loaded, refresh directly with HLS.js
        if (c["media-video"] && c["media-video"].videoTexture && c["media-video"].videoTexture.hls) {
          c["media-video"].videoTexture.hls.recoverMediaError();
        } else if (c["media-loader"]) {
          // Otherwise fall back to hard resolve-level refresh which should work for any media
          c["media-loader"].update(c["media-loader"].data, true);
        }
      }
    };

    NAF.utils
      .getNetworkedEntity(this.el)
      .then(networkedEl => (this.targetEl = networkedEl))
      .catch(() => this.el.parentNode.removeChild(this.el));
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});

AFRAME.registerComponent("refresh-media-button", {
  init() {
    this.updateVisibility = this.updateVisibility.bind(this);

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
            this.updateVisibility();
          },
          { once: true }
        );
      }
    };

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;

      window.APP.hubChannel.addEventListener("permissions_updated", this.updateVisibility);

      if (this.targetEl) {
        this.targetEl.addEventListener("pinned", this.updateVisibility);
        this.targetEl.addEventListener("unpinned", this.updateVisibility);
      }

      this.updateVisibility();
    });
  },

  updateVisibility() {
    if (!this.targetEl) return;

    const isPinned = this.targetEl.components.pinnable && this.targetEl.components.pinnable.data.pinned;
    this.el.object3D.visible =
      (!isPinned && window.APP.hubChannel.can("spawn_and_move_media")) || window.APP.hubChannel.can("pin_objects");
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  },

  remove() {
    window.APP.hubChannel.removeEventListener("permissions_updated", this.updateVisibility);

    if (this.targetEl) {
      this.targetEl.removeEventListener("pinned", this.updateVisibility);
      this.targetEl.removeEventListener("unpinned", this.updateVisibility);
    }
  }
});
