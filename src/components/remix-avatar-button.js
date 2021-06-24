import { idForAvatarUrl } from "../utils/media-url-utils";
import { fetchAvatar, remixAvatar } from "../utils/avatar-utils";

const REMIX_LABEL = "save avatar";
AFRAME.registerComponent("remix-avatar-button", {
  init() {
    this.label = this.el.querySelector("[text]");
    this.label.setAttribute("text", "value", REMIX_LABEL);
    this.updateSrc = async () => {
      this.src = this.targetEl.components["media-loader"].data.src;
      try {
        this.avatar = await fetchAvatar(idForAvatarUrl(this.src));
        this.el.object3D.visible = this.avatar && this.avatar.allow_remixing && this.avatar.type === "avatar_listing";
      } catch (e) {
        console.error(e);
        this.el.object3D.visible = false;
      }
    };

    this.onClick = async () => {
      if (this.copying || !this.avatar) return;

      try {
        this.copying = true;
        this.label.setAttribute("text", "value", "Saving...");

        await remixAvatar(this.avatar.avatar_id, this.avatar.name);

        this.label.setAttribute("text", "value", "Saved!");
      } catch (e) {
        this.label.setAttribute("text", "value", "Error");
      }

      setTimeout(() => {
        this.label.setAttribute("text", "value", REMIX_LABEL);
        this.copying = false;
      }, 2000);
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
