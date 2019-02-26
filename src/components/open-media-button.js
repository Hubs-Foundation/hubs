import { isHubsSceneUrl, isHubsRoomUrl } from "../utils/media-utils";

AFRAME.registerComponent("open-media-button", {
  init() {
    this.label = this.el.querySelector("[text]");

    this.updateSrc = () => {
      this.src = this.targetEl.components["media-loader"].data.src;

      let label = "open link";

      if (isHubsSceneUrl(this.src)) {
        label = "use scene";
      } else if (isHubsRoomUrl(this.src)) {
        label = "visit room";
      }

      this.label.setAttribute("text", "value", label);
    };

    this.onClick = () => {
      if (isHubsSceneUrl(this.src)) {
        this.el.sceneEl.emit("scene_media_selected", this.src);
      } else if (isHubsRoomUrl(this.src)) {
        location.href = this.src;
      } else {
        window.open(this.src);
      }
    };

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
      this.targetEl.addEventListener("media_resolved", this.updateSrc, { once: true });
      this.updateSrc();
    });
  },

  play() {
    this.el.addEventListener("grab-start", this.onClick);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onClick);
  }
});
