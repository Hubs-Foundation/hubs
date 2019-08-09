import { waitForDOMContentLoaded } from "../utils/async-utils";

const CAMERA_UPDATE_FRAME_DELAY = 10; // Update one camera every N'th frame

// Used for tracking and managing camera tools in the scene
AFRAME.registerSystem("camera-tools", {
  init() {
    this.cameraEls = [];
    this.cameraUpdateCount = 0;
    this.ticks = 0;

    waitForDOMContentLoaded().then(() => {
      const playerModelEl = document.querySelector("#avatar-rig .model");
      playerModelEl.addEventListener("model-loading", () => (this.playerHead = null));
      playerModelEl.addEventListener("model-loaded", this.updatePlayerHead.bind(this));
      this.updatePlayerHead();
    });
  },

  updatePlayerHead() {
    const headEl = document.getElementById("avatar-head");
    this.playerHead = headEl && headEl.object3D;
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

  getMyCamera() {
    if (this.myCamera !== undefined) return this.myCamera;
    this.myCamera = this.cameraEls.find(NAF.utils.isMine) || null;
    return this.myCamera;
  },

  _onOwnershipChange() {
    this.myCamera = null;
  },

  tick() {
    this.ticks++;

    // We update at most one camera viewfinder per frame.
    if (this.ticks % CAMERA_UPDATE_FRAME_DELAY === 0) {
      if (this.cameraEls.length == 0) return;

      this.cameraUpdateCount++;
      this.cameraEls[this.cameraUpdateCount % this.cameraEls.length].components["camera-tool"].updateViewfinder();
    }
  }
});
