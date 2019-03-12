import { findAncestorWithComponent } from "../utils/scene-graph";

AFRAME.registerComponent("unmute-video-button", {
  init() {
    this.onClick = () => {
      const videoEl = findAncestorWithComponent(this.el, "media-video");
      const mediaVideo = videoEl.components["media-video"];
      if (!mediaVideo || !mediaVideo.video) return;
      mediaVideo.video.muted = false;
      this.el.setAttribute("visible", false);
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
