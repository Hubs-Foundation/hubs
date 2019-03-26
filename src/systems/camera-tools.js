// Used for tracking and managing camera tools in the scene
AFRAME.registerSystem("camera-tools", {
  init() {
    this.cameraEls = [];
  },

  register(el) {
    this.cameraEls.push(el);
    el.addEventListener("ownership-changed", this._onOwnershipChange);
    delete this.myCamera;
  },

  deregister(el) {
    this.cameraEls = this.cameraEls.filter(c => c !== el);
    el.removeEventListener("ownership-changed", this._onOwnershipChange);
    delete this.myCamera;
  },

  avatarUpdated() {
    this.cameraEls.forEach(el => delete el.components["camera-tool"].onAvatarUpdated());
  },

  getMyCamera() {
    if (this.myCamera !== undefined) return this.myCamera;
    this.myCamera = this.cameraEls.find(NAF.utils.isMine) || null;
    return this.myCamera;
  },

  _onOwnershipChange() {
    this.myCamera = null;
  }
});
