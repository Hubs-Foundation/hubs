AFRAME.registerComponent("pin-networked-object-button", {
  schema: {
    // Selector for root of all UI that needs to be clickable when pinned
    uiSelector: { type: "string" },

    // Selector for label to change when pinned/unpinned
    labelSelector: { type: "string" },

    // Selector for items to hide iff pinned
    hideWhenPinnedSelector: { type: "string" }
  },

  init() {
    this._updateUI = this._updateUI.bind(this);
    this.el.sceneEl.addEventListener("stateadded", this._updateUI);
    this.el.sceneEl.addEventListener("stateremoved", this._updateUI);

    let uiElSearch = this.el;

    do {
      uiElSearch = uiElSearch.parentNode;
      this.uiEl = uiElSearch.querySelector(this.data.uiSelector);
    } while (uiElSearch && !this.uiEl);

    this.uiEl = uiElSearch.querySelector(this.data.uiSelector);
    this.labelEl = this.uiEl.querySelector(this.data.labelSelector);

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
    };
  },

  play() {
    this.el.addEventListener("grab-start", this.onClick);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onClick);
  },

  remove() {
    this.el.sceneEl.removeEventListener("stateadded", this._updateUI);
    this.el.sceneEl.removeEventListener("stateremoved", this._updateUI);

    if (this.targetEl) {
      this.targetEl.removeEventListener("pinned", this._updateUI);
      this.targetEl.removeEventListener("unpinned", this._updateUI);
    }
  },

  _updateUI() {
    const isPinned = this.targetEl.components.pinnable && this.targetEl.components.pinnable.data.pinned;

    this.labelEl.setAttribute("text", { value: isPinned ? "un-pin" : "pin" });

    this.el.parentNode.querySelectorAll(this.data.hideWhenPinnedSelector).forEach(hideEl => {
      hideEl.setAttribute("visible", !isPinned);
    });
  }
});
