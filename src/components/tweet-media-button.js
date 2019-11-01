import { messages } from "../utils/i18n";

AFRAME.registerComponent("tweet-media-button", {
  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });

    this.onClick = () => {
      const hasDiscordBridges = window.APP.hubChannel && window.APP.hubChannel.discordBridges().length > 0;

      const text = !hasDiscordBridges
        ? `Taken in ${messages["app-domain"]} - ` +
          `join me now at ${messages["app-short-domain"]}/${window.APP.hubChannel.hubId}! `
        : `Taken in ${messages["app-domain"]} `;

      const { src, contentSubtype } = this.targetEl.components["media-loader"].data;
      this.el.sceneEl.emit("action_media_tweet", { url: src, contentSubtype, text, el: this.targetEl });
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
