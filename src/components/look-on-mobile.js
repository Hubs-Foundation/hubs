const PolyfillControls = AFRAME.utils.device.PolyfillControls;
const PI_4 = Math.PI / 4;
const PI_2 = Math.PI / 2;
const TWOPI = Math.PI * 2;

const abs = Math.abs;
// Input: two numbers between [-Math.PI, Math.PI]
// Output: difference between them, where -Math.PI === Math.PI
const difference = (curr, prev) => {
  const a = curr - prev;
  const b = curr + TWOPI - prev;
  const c = curr - (prev + TWOPI);
  if (abs(a) < abs(b)) {
    if (abs(a) < abs(c)) {
      return a;
    }
  }
  if (abs(b) < abs(c)) {
    return b;
  }

  return c;
};

const average = a => {
  let sum = 0;
  a.forEach(n => (sum += n));
  return sum / a.length;
};

AFRAME.registerComponent("look-on-mobile", {
  schema: {
    enabled: { default: false },
    horizontalLookSpeedRatio: { default: 0.4 }, // motion applied to camera / motion of polyfill object
    verticalLookSpeedRatio: { default: 0.4 } // motion applied to camera / motion of polyfill object
  },

  init() {
    this.hmdEuler = new THREE.Euler();
    this.prevX = this.hmdEuler.x;
    this.prevY = this.hmdEuler.y;
    this.ticks = 0;
    this.pendingLookX = 0;
    this.onRotateX = this.onRotateX.bind(this);
    this.dXBuffer = [];
    this.dYBuffer = [];
  },

  play() {
    this.el.addEventListener("rotateX", this.onRotateX);
    this.polyfillObject = new THREE.Object3D();
    this.polyfillControls = new PolyfillControls(this.polyfillObject);
  },
  pause() {
    this.el.removeEventListener("rotateX", this.onRotateX);
    this.polyfillControls = null;
    this.polyfillObject = null;
  },
  onRotateX(e) {
    this.pendingLookX = e.detail.value * 0.8;
  },

  registerLookControls(lookControls) {
    this.lookControls = lookControls;
    this.lookControls.data.enabled = false;
    this.lookControls.polyfillControls.update = () => {};
  },

  tick(t, dt) {
    if (!this.data.enabled) return;
    const scene = this.el.sceneEl;
    const hmdEuler = this.hmdEuler;
    const pitchObject = this.lookControls.pitchObject;
    const yawObject = this.lookControls.yawObject;
    const joystick = this.pendingLookX * dt / 1000;
    const { horizontalLookSpeedRatio, verticalLookSpeedRatio } = this.data;
    if (scene.is("vr-mode") && scene.checkHeadsetConnected()) return;
    this.polyfillControls.update();
    hmdEuler.setFromQuaternion(this.polyfillObject.quaternion, "YXZ");

    const dX = difference(hmdEuler.x, this.prevX);
    const dY = difference(hmdEuler.y, this.prevY);

    this.dXBuffer.push(Math.abs(dX) < 0.001 ? 0 : dX);
    this.dYBuffer.push(Math.abs(dY) < 0.001 ? 0 : dY);

    if (this.dXBuffer.length > 5) {
      this.dXBuffer.splice(0, 1);
    }
    if (this.dYBuffer.length > 5) {
      this.dYBuffer.splice(0, 1);
    }

    yawObject.rotation.y += average(this.dYBuffer) * horizontalLookSpeedRatio;
    pitchObject.rotation.x += average(this.dXBuffer) * verticalLookSpeedRatio + joystick;
    pitchObject.rotation.x = Math.max(-PI_4, Math.min(PI_4, pitchObject.rotation.x));

    this.lookControls.updateOrientation();
    this.prevX = hmdEuler.x;
    this.prevY = hmdEuler.y;
    this.pendingLookX = 0;
  }
});
