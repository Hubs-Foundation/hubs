import { paths } from "./userinput/paths";

AFRAME.registerSystem("camera-mirror", {
  init() {
    this._onWindowResize = this._onWindowResize.bind(this);
    window.addEventListener("resize", this._onWindowResize, false);
  },

  tick() {
    const userinput = this.el.systems.userinput;

    if (userinput.get(paths.actions.camera.exitMirror) && this.mirrorEl) {
      this.unmirrorCameraAtEl(this.mirrorEl);
    }
  },

  // Adds a camera under el, and starts mirroring
  mirrorCameraAtEl(el) {
    // TODO probably should explicitly check for immersive mode here.
    if (AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR()) return;
    if (this.mirrorEl && this.mirrorEl !== el) this.unmirrorCameraAtEl(this.mirrorEl);

    this.mirrorEl = el;
    this.mirrorCamera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 30000);
    this.mirrorCamera.rotation.set(0, Math.PI, 0);
    el.setObject3D("mirror-camera", this.mirrorCamera);

    document.body.classList.add("mirrored-camera");

    if (!this.directRenderFunc) {
      this._patchRenderFunc();
    }

    this.mirrorEl.emit("mirrored", { el: this.mirrorEl });
    this.mirrorEl.sceneEl.addState("mirroring");
  },

  unmirrorCameraAtEl(el) {
    if (this.mirrorEl !== el) return;

    el.removeObject3D("mirror-camera");
    document.body.classList.remove("mirrored-camera");
    const oldEl = this.mirrorEl;

    this.mirrorEl = null;
    this.mirrorCamera = null;

    oldEl.emit("unmirrored", { el: oldEl });
    oldEl.sceneEl.removeState("mirroring");
  },

  getMirroredCameraEl() {
    return this.mirrorEl;
  },

  _onWindowResize() {
    if (!this.mirrorCamera) return;
    this.mirrorCamera.aspect = window.innerWidth / window.innerHeight;
    this.mirrorCamera.updateProjectionMatrix();
    this.el.sceneEl.renderer.setSize(window.innerWidth, window.innerHeight);
  },

  _patchRenderFunc() {
    const headEl = document.getElementById("player-head");
    const hudEl = document.getElementById("player-hud");
    const tempHeadScale = new THREE.Vector3();
    const renderer = this.el.renderer;
    const playerHead = headEl && headEl.object3D;
    const playerHud = hudEl && hudEl.object3D;

    this.directRenderFunc = renderer.render;

    this.el.sceneEl.renderer.render = (scene, camera, renderTarget) => {
      const wasVREnabled = renderer.vr.enabled;

      if (wasVREnabled || renderTarget || !this.mirrorCamera) {
        this.directRenderFunc.call(renderer, scene, camera, renderTarget);
        if (!this.mirrorCamera || renderTarget) return;
      }

      if (playerHead) {
        tempHeadScale.copy(playerHead.scale);
        playerHead.scale.set(1, 1, 1);
        playerHead.updateMatrices(true, true);
        playerHead.updateMatrixWorld(true, true);
      }

      let playerHudWasVisible;

      if (playerHud) {
        playerHudWasVisible = playerHud.visible;
        playerHud.visible = false;
        if (this.el.sceneEl.systems["post-physics"]) {
          this.el.sceneEl.systems["post-physics"].spriteSystem.mesh.visible = false;
        }
      }
      renderer.vr.enabled = false;
      const tmpOnAfterRender = this.el.object3D.onAfterRender;
      delete this.el.object3D.onAfterRender;
      this.directRenderFunc.call(renderer, scene, this.mirrorCamera);
      this.el.object3D.onAfterRender = tmpOnAfterRender;
      renderer.vr.enabled = wasVREnabled;
      if (playerHead) {
        playerHead.scale.copy(tempHeadScale);
        playerHead.updateMatrices(true, true);
        playerHead.updateMatrixWorld(true);
      }
      if (playerHud) {
        playerHud.visible = playerHudWasVisible;
        if (this.el.sceneEl.systems["post-physics"]) {
          this.el.sceneEl.systems["post-physics"].spriteSystem.mesh.visible = true;
        }
      }
    };
  }
});
