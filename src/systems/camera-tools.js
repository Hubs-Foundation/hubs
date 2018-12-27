// Used for tracking and managing camera tools in the scene
AFRAME.registerSystem("camera-tools", {
  init() {
    this.cameraEls = [];
  },

  register(el) {
    this.cameraEls.push(el);
    el.addEventListener("ownership-changed", this._onOwnershipChange);
    this.myCamera = null;
  },

  deregister(el) {
    this.cameraEls = this.cameraEls.filter(c => c !== el);
    el.removeEventListener("ownership-changed", this._onOwnershipChange);
    this.myCamera = null;
  },

  getMyCamera() {
    if (this.myCamera) return this.myCamera;
    this.myCamera = this.cameraEls.find(NAF.utils.isMine);
    return this.myCamera;
  },

  _onOwnershipChange() {
    this.myCamera = null;
  }
});
