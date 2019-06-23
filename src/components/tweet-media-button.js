AFRAME.registerComponent("tweet-media-button", {
  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });

    this.onClick = () => {
      const text = `Taken in Mozilla #hubs, join me: hub.link/${window.APP.hubChannel.hubId}`;
      this.el.sceneEl.emit("action_media_tweet", { url: this.targetEl.components["media-loader"].data.src, text });
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
