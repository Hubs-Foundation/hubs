import { isHubsSceneUrl, isHubsRoomUrl, isHubsAvatarUrl } from "../utils/media-url-utils";
import { guessContentType } from "../utils/media-url-utils";

AFRAME.registerComponent("open-media-button", {
  init() {
    this.label = this.el.querySelector("[text]");

    this.updateSrc = () => {
      const src = (this.src = this.targetEl.components["media-loader"].data.src);
      const visible = src && guessContentType(src) !== "video/vnd.hubs-webrtc";
      const mayChangeScene = this.el.sceneEl.systems.permissions.canOrWillIfCreator("update_hub");

      this.el.object3D.visible = !!visible;

      if (visible) {
        let label = "open link";
        if (isHubsAvatarUrl(src)) {
          label = "use avatar";
        } else if (isHubsSceneUrl(src) && mayChangeScene) {
          label = "use scene";
        } else if (isHubsRoomUrl(src)) {
          label = "visit room";
        }
        this.label.setAttribute("text", "value", label);
      }
    };

    this.onClick = () => {
      const mayChangeScene = this.el.sceneEl.systems.permissions.canOrWillIfCreator("update_hub");

      if (isHubsAvatarUrl(this.src)) {
        const avatarId = new URL(this.src).pathname.split("/").pop();
        window.APP.store.update({ profile: { avatarId } });
      } else if (isHubsSceneUrl(this.src) && mayChangeScene) {
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
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
