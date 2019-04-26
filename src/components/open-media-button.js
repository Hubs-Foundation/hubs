import { isHubsSceneUrl, isHubsRoomUrl } from "../utils/media-utils";
import { guessContentType } from "../utils/media-utils";

AFRAME.registerComponent("window-open-button", {
  init() {
    this.updateSrc = () => {
      this.src = this.targetEl.components["media-loader"].data.src;
      this.el.object3D.visible = !!this.src;
    };
    this.onClick = () => {
      window.open(this.src);
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

AFRAME.registerComponent("open-media-button", {
  schema: {
    useScenePermissionTipSelector: { type: "string" }
  },
  init() {
    this.label = this.el.querySelector("[text]");
    if (this.data.useScenePermissionTipSelector) {
      this.sceneTip = this.el.parentEl.querySelector(this.data.useScenePermissionTipSelector);
    }

    this.updateSrc = () => {
      const src = (this.src = this.targetEl.components["media-loader"].data.src);
      const visible = src && guessContentType(src) !== "video/vnd.hubs-webrtc";
      this.el.object3D.visible = !!visible;

      if (visible) {
        let label = "open link";
        if (isHubsSceneUrl(src)) {
          label = "use scene";
        } else if (isHubsRoomUrl(src)) {
          label = "visit room";
        }
        this.label.setAttribute("text", "value", label);
      }
    };

    this.onHover = () => {
      if (isHubsSceneUrl(this.src) && !window.APP.hubChannel.permissions.update_hub && this.sceneTip) {
        this.sceneTip.object3D.visible = true;
      }
    };
    this.onUnhover = () => {
      if (this.sceneTip) {
        this.sceneTip.object3D.visible = false;
      }
    };

    this.onClick = () => {
      if (isHubsSceneUrl(this.src)) {
        if (window.APP.hubChannel.permissions.update_hub) {
          this.el.sceneEl.emit("scene_media_selected", this.src);
        }
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
    this.el.object3D.addEventListener("hovered", this.onHover);
    this.el.object3D.addEventListener("unhovered", this.onUnhover);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
    this.el.object3D.removeEventListener("hovered", this.onHover);
    this.el.object3D.removeEventListener("unhovered", this.onUnhover);
  }
});
