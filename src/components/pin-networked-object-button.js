import { getPromotionTokenForFile } from "../utils/media-utils";

AFRAME.registerComponent("pin-networked-object-button", {
  schema: {
    // Selector for label informing users about Discord bridging of pins.
    tipSelector: { type: "string" },

    // Selector for label to change when pinned/unpinned, must be sibling of this components element
    labelSelector: { type: "string" },

    // Selector for items to hide iff pinned
    hideWhenPinnedSelector: { type: "string" }
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

    this.onHover = () => {
      this.hovering = true;
      this._updateUI();
    };

    this.onHoverOut = () => {
      this.hovering = false;
      this._updateUI();
    };

    this.onClick = () => {
      if (!NAF.utils.isMine(this.targetEl) && !NAF.utils.takeOwnership(this.targetEl)) return;

      const wasPinned = this.targetEl.components.pinnable && this.targetEl.components.pinnable.data.pinned;
      this.targetEl.setAttribute("pinnable", "pinned", !wasPinned);
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
    this.el.object3D.addEventListener("hover", this.onHover);
    this.el.object3D.addEventListener("unhover", this.onHoverOut);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
    this.el.object3D.removeEventListener("hover", this.onHover);
    this.el.object3D.removeEventListener("unhover", this.onHoverOut);
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
    return []; // TODO mqp
    const presences = window.APP.hubChannel.presence.state;
    if (!presences) {
      return [];
    } else {
      return Object.values(presences)
        .flatMap(p => p.metas.map(m => m.context.discord))
        .filter(ch => !!ch);
    }
  },

  _updateUIOnStateChange(e) {
    if (e.detail !== "frozen") return;
    this._updateUI();
  },

  _updateUI() {
    const { fileIsOwned, fileId } = this.targetEl.components["media-loader"].data;
    const canPin = !!(fileIsOwned || (fileId && getPromotionTokenForFile(fileId)));
    this.el.setAttribute("visible", canPin);
    this.labelEl.setAttribute("visible", canPin);

    const isPinned = this.targetEl.getAttribute("pinnable") && this.targetEl.getAttribute("pinnable").pinned;
    const discordBridges = this._discordBridges();
    this.tipEl.setAttribute("visible", !!(canPin && !isPinned && this.hovering && discordBridges.length > 0));

    if (!canPin) return;
    this.labelEl.setAttribute("text", "value", isPinned ? "un-pin" : "pin");
    this.el.setAttribute("text-button", "backgroundColor", isPinned ? "#fff" : "#ff3550");
    this.el.setAttribute("text-button", "backgroundHoverColor", isPinned ? "#bbb" : "#fc3545");

    this.el.parentNode.querySelectorAll(this.data.hideWhenPinnedSelector).forEach(hideEl => {
      hideEl.setAttribute("visible", !isPinned);
    });
  }
});
