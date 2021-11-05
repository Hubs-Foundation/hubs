import configs from "../utils/configs";

AFRAME.registerComponent("tweet-media-button", {
  init() {
    NAF.utils
      .getNetworkedEntity(this.el)
      .then(networkedEl => {
        console.log("inside then() indicates networking this.targetEl: tweet-media-button");
        this.targetEl = networkedEl;
      })
      .catch(() => {
        console.log("inside catch() indicates networking failed so don't show media button: tweet-media-button");
        console.log(configs.integration("twitter"));
        // Non-networked, do not handle for now, and hide button.
        this.el.object3D.visible = false;
      });

    this.onClick = () => {
      const initialTweet = `Taken in ${location.hostname}`;

      const { src, contentSubtype } = this.targetEl.components["media-loader"].data;
      this.el.sceneEl.emit("action_media_tweet", { mediaUrl: src, contentSubtype, initialTweet });
    };
  },

  play() {
    console.log("inside play() tweet-media-button");
    console.log(configs.integration("twitter"));
    // if (!configs.integration("twitter")) {
    //   this.el.object3D.visible = false;
    //   return;
    // }
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
