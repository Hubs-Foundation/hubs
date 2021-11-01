import { getPromotionTokenForFile } from "../utils/media-utils";
import { SOUND_PIN } from "../systems/sound-effects-system";
import { applyThemeToTextButton } from "../utils/theme";

AFRAME.registerComponent("pin-networked-object-button", {
  schema: {
    // Selector for label informing users about Discord bridging of pins.
    tipSelector: { type: "string" },

    // Selector for label to change when pinned/unpinned, must be sibling of this components element
    labelSelector: { type: "string" }
  },

  init() {
    this._updateUI = this._updateUI.bind(this);
    this._updateUIOnStateChange = this._updateUIOnStateChange.bind(this);
    this.el.sceneEl.addEventListener("stateadded", this._updateUIOnStateChange);
    this.el.sceneEl.addEventListener("stateremoved", this._updateUIOnStateChange);

    this.tipEl = this.el.parentNode.querySelector(this.data.tipSelector);
    this.labelEl = this.el.parentNode.querySelector(this.data.labelSelector);

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;

      this._updateUI();
      this.targetEl.addEventListener("pinned", this._updateUI);
      this.targetEl.addEventListener("unpinned", this._updateUI);
    });

    this.onHovered = () => {
      this.hovering = true;
      this._updateUI();
    };

    this.onUnhovered = () => {
      this.hovering = false;
      this._updateUI();
    };

    this.onClick = () => {
      if (!NAF.utils.isMine(this.targetEl) && !NAF.utils.takeOwnership(this.targetEl)) return;

      const wasPinned = this.targetEl.components.pinnable && this.targetEl.components.pinnable.data.pinned;
      window.APP.pinningHelper.setPinned(this.targetEl, !wasPinned);
      if (!wasPinned) {
        this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_PIN);
      }
    };

    APP.store.addEventListener("themechanged", this._updateUI);
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
    this.el.object3D.addEventListener("hovered", this.onHovered);
    this.el.object3D.addEventListener("unhovered", this.onUnhovered);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
    this.el.object3D.removeEventListener("hovered", this.onHovered);
    this.el.object3D.removeEventListener("unhovered", this.onUnhovered);
  },

  remove() {
    this.el.sceneEl.removeEventListener("stateadded", this._updateUIOnStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this._updateUIOnStateChange);

    if (this.targetEl) {
      this.targetEl.removeEventListener("pinned", this._updateUI);
      this.targetEl.removeEventListener("unpinned", this._updateUI);
    }
  },

  _discordBridges() {
    return window.APP.hubChannel.discordBridges();
  },

  _updateUIOnStateChange(e) {
    if (e.detail !== "frozen") return;
    this._updateUI();
  },

  _updateUI() {
    const { fileIsOwned, fileId } = this.targetEl.components["media-loader"].data;
    const canPin =
      window.APP.hubChannel.can("pin_objects") && !!(fileIsOwned || (fileId && getPromotionTokenForFile(fileId)));
    this.el.object3D.visible = canPin;
    this.labelEl.object3D.visible = canPin;

    const isPinned = this.targetEl.getAttribute("pinnable") && this.targetEl.getAttribute("pinnable").pinned;
    const discordBridges = this._discordBridges();
    this.tipEl.object3D.visible = !!(canPin && !isPinned && this.hovering && discordBridges.length > 0);

    if (!canPin) return;
    this.labelEl.setAttribute("text", "value", isPinned ? "un-pin" : "pin");
    applyThemeToTextButton(this.el, isPinned);
  }
});
