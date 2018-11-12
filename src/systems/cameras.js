// Used for tracking and managing camera tools in the scene
AFRAME.registerSystem("cameras", {
  init() {
    this.cameraEls = [];
  },

  register(el) {
    this.cameraEls.push(el);
    el.addEventListener("ownership-changed", this._onOwnershipChange);
    this.currentCamera = null;
  },

  deregister(el) {
    this.cameraEls = this.cameraEls.filter(c => c !== el);
    el.removeEventListener("ownership-changed", this._onOwnershipChange);
    this.currentCamera = null;
  },

  getCurrent() {
    if (this.currentCamera) return this.currentCamera;
    this.currentCamera = this.cameraEls.find(NAF.utils.isMine);
    return this.currentCamera;
  },

  _onOwnershipChange() {
    this.currentCamera = null;
  }
});
