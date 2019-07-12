AFRAME.registerComponent("tweet-media-button", {
  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });

    this.onClick = () => {
      const hasDiscordBridges = window.APP.hubChannel && window.APP.hubChannel.discordBridges().length > 0;

      const text = !hasDiscordBridges
        ? `Taken in hubs.mozilla.com - join me now at hub.link/${window.APP.hubChannel.hubId}! `
        : `Taken in hubs.mozilla.com `;

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
