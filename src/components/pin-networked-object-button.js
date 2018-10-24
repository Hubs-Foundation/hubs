AFRAME.registerComponent("pin-networked-object-button", {
  schema: {
    labelSelector: { type: "string" },
    hideWhenPinnedSelector: { type: "string" }
  },

  init() {
    this._updateUI = this._updateUI.bind(this);
    this.scene = document.querySelector("a-scene");
    this.labelEl = this.el.parentNode.querySelector(this.data.labelSelector);

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;

      this._updateUI();
      this.targetEl.addEventListener("pinned", this._updateUI);
      this.targetEl.addEventListener("unpinned", this._updateUI);
    });

    this.onClick = () => {
      if (!NAF.utils.isMine(this.targetEl) && !NAF.utils.takeOwnership(this.targetEl)) return;

      const wasPinned = this.targetEl.components.pinnable && this.targetEl.components.pinnable.data.pinned;
      this.targetEl.setAttribute("pinnable", { pinned: !wasPinned });
      this.scene.emit("action_freeze");
    };
  },

  play() {
    this.el.addEventListener("click", this.onClick);
  },

  pause() {
    this.el.removeEventListener("click", this.onClick);
  },

  remove() {
    if (this.targetEl) {
      this.targetEl.removeEventListener("pinned", this._updateUI);
      this.targetEl.removeEventListener("unpinned", this._updateUI);
    }
  },

  _updateUI() {
    const isPinned = this.targetEl.components.pinnable && this.targetEl.components.pinnable.data.pinned;

    if (isPinned) {
      this.el.parentNode.setAttribute("clickable", "");
      this.labelEl.setAttribute("text", { value: "un-pin" });
    } else {
      this.el.parentNode.removeAttribute("clickable");
      this.labelEl.setAttribute("text", { value: "pin" });
    }

    this.el.parentNode.querySelectorAll(this.data.hideWhenPinnedSelector).forEach(hideEl => {
      hideEl.setAttribute("visible", !isPinned);
    });
  }
});
