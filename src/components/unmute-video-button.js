import { findAncestorWithComponent } from "../utils/scene-graph";

AFRAME.registerComponent("unmute-video-button", {
  init() {
    this.onClick = () => {
      const videoEl = findAncestorWithComponent(this.el, "media-video");
      const mediaVideo = videoEl.components["media-video"];
      if (!mediaVideo || !mediaVideo.video || !mediaVideo.videoMutedAt) return;

      // iOS initially plays the sound and *then* mutes it, and sometimes a second video playing
      // can break all sound in the app. (Likely a Safari bug.) Adding a delay before the unmute
      // occurs seems to help with reducing this.
      if (performance.now() - mediaVideo.videoMutedAt < 3000) {
        return;
      }

      if (mediaVideo.video.muted) {
        mediaVideo.video.muted = false;
        this.el.setAttribute("visible", false);
      }
    };
  },

  play() {
    // Safari won't accept grab-start or even mousedown as user-initiated gestures,
    // so we have to use a global touchstart event here.
    document.addEventListener("touchstart", this.onClick);
  },

  pause() {
    document.removeEventListener("touchstart", this.onClick);
  }
});
