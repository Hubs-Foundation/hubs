AFRAME.registerComponent("mirror-camera-button", {
  schema: {
    // Selector for label to change when mirroring/un-mirroring
    labelSelector: { type: "string" }
  },

  init() {
    this._updateUI = this._updateUI.bind(this);
    this._isMirrored = this._isMirrored.bind(this);
    this.labelEl = this.el.parentNode.querySelector(this.data.labelSelector);

    this.onClick = () => {
      if (!this._isMirrored()) {
        this.targetEl.components["camera-tool"].mirror();
      } else {
        this.targetEl.components["camera-tool"].unmirror();
      }
    };

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
      this.targetEl.addEventListener("mirrored", this._updateUI);
      this.targetEl.addEventListener("unmirrored", this._updateUI);
      this._updateUI();
    });
  },

  play() {
    this.el.addEventListener("grab-start", this.onClick);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onClick);
  },

  _isMirrored() {
    return this.targetEl === this.el.sceneEl.systems["camera-mirror"].getMirroredCameraEl();
  },

  _updateUI() {
    const isMirrored = this._isMirrored();
    this.labelEl.setAttribute("text", "value", isMirrored ? "unmirror" : "mirror");
    this.el.setAttribute("text-button", "backgroundColor", isMirrored ? "#fff" : "#ff0520");
    this.el.setAttribute("text-button", "backgroundHoverColor", isMirrored ? "#aaa" : "#cc0515");
  }
});
