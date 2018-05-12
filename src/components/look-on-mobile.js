const PolyfillControls = AFRAME.utils.device.PolyfillControls;
const PI_4 = Math.PI / 4;

AFRAME.registerComponent("look-on-mobile", {
  schema: {
    enabled: { default: false },
    horizontalLookSpeedRatio: { default: 0.4 }, // motion of polyfill object / motion of camera
    verticalLookSpeedRatio: { default: 0.4 } // motion of polyfill object / motion of camera
  },

  init() {
    this.hmdEuler = new THREE.Euler();
    this.prevX = this.hmdEuler.x;
    this.prevY = this.hmdEuler.y;
    this.polyfillObject = new THREE.Object3D();
    this.polyfillControls = new PolyfillControls(this.polyfillObject);
    this.ticks = 0;
    this.pendingLookX = 0;
    this.onRotateX = this.onRotateX.bind(this);
  },

  play() {
    this.el.addEventListener("rotateX", this.onRotateX);
  },
  pause() {
    this.el.removeEventListener("rotateX", this.onRotateX);
  },
  onRotateX(e) {
    this.pendingLookX = e.detail.value * 2;
  },

  registerLookControls(lookControls) {
    this.lookControls = lookControls;
    this.lookControls.data.enabled = false;
    this.lookControls.polyfillControls.update = () => {};
  },

  tick(t, dt) {
    if (!this.data.enabled) return;
    const scene = this.el.sceneEl;
    const rotation = this.rotation;
    const hmdEuler = this.hmdEuler;
    const pitchObject = this.lookControls.pitchObject;
    const yawObject = this.lookControls.yawObject;
    const { horizontalLookSpeedRatio, verticalLookSpeedRatio } = this.data;
    if (scene.is("vr-mode") && scene.checkHeadsetConnected()) return;
    this.polyfillControls.update();
    hmdEuler.setFromQuaternion(this.polyfillObject.quaternion, "YXZ");

    const joystick = this.pendingLookX * dt / 1000;
    const dX = joystick + hmdEuler.x - this.prevX;
    const dY = hmdEuler.y - this.prevY;

    yawObject.rotation.y += dY * horizontalLookSpeedRatio;
    pitchObject.rotation.x += dX * verticalLookSpeedRatio;
    pitchObject.rotation.x = Math.max(-PI_4, Math.min(PI_4, pitchObject.rotation.x));

    this.lookControls.updateOrientation();
    this.prevX = hmdEuler.x;
    this.prevY = hmdEuler.y;
    this.pendingLookX = 0;
  }
});
