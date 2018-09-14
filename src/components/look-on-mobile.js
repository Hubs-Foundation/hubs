const TWOPI = Math.PI * 2;

class CircularBuffer {
  constructor(length) {
    this.items = new Array(length).fill(0);
    this.writePtr = 0;
  }

  push(item) {
    this.items[this.writePtr] = item;
    this.writePtr = (this.writePtr + 1) % this.items.length;
  }
}

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
  for (let i = 0; i < a.length; i++) {
    const n = a[i];
    sum += n;
  }
  return sum / a.length;
};

AFRAME.registerComponent("look-on-mobile", {
  schema: {
    horizontalLookSpeedRatio: { default: 1.0 }, // motion applied to camera / motion of polyfill object
    verticalLookSpeedRatio: { default: 1.0 }, // motion applied to camera / motion of polyfill object
    camera: { type: "selector" }
  },

  init() {
    this.hmdEuler = new THREE.Euler();
    this.hmdQuaternion = new THREE.Quaternion();
    this.prevX = this.hmdEuler.x;
    this.prevY = this.hmdEuler.y;
    this.pendingLookX = 0;
    this.onRotateX = this.onRotateX.bind(this);
    this.dXBuffer = new CircularBuffer(6);
    this.dYBuffer = new CircularBuffer(6);
    this.vrDisplay = window.webvrpolyfill.getPolyfillDisplays()[0];
    this.frameData = new window.webvrpolyfill.constructor.VRFrameData();
  },

  play() {
    this.el.addEventListener("rotateX", this.onRotateX);
  },

  pause() {
    this.el.removeEventListener("rotateX", this.onRotateX);
  },

  update() {
    this.cameraController = this.data.camera.components["pitch-yaw-rotator"];
  },

  onRotateX(e) {
    this.pendingLookX = e.detail.value;
  },

  tick() {
    //const hmdEuler = this.hmdEuler;
    //const { horizontalLookSpeedRatio, verticalLookSpeedRatio } = this.data;
    //this.vrDisplay.getFrameData(this.frameData);
    //if (this.frameData.pose.orientation !== null) {
    //  this.hmdQuaternion.fromArray(this.frameData.pose.orientation);
    //  hmdEuler.setFromQuaternion(this.hmdQuaternion, "YXZ");
    //}

    //const dX = THREE.Math.RAD2DEG * difference(hmdEuler.x, this.prevX);
    //const dY = THREE.Math.RAD2DEG * difference(hmdEuler.y, this.prevY);

    //this.dXBuffer.push(Math.abs(dX) < 0.001 ? 0 : dX);
    //this.dYBuffer.push(Math.abs(dY) < 0.001 ? 0 : dY);

    //const deltaYaw = average(this.dYBuffer.items) * horizontalLookSpeedRatio;
    //const deltaPitch = average(this.dXBuffer.items) * verticalLookSpeedRatio + this.pendingLookX;

    //this.cameraController.look(deltaPitch, deltaYaw);

    //this.prevX = hmdEuler.x;
    //this.prevY = hmdEuler.y;
    //this.pendingLookX = 0;
  }
});
