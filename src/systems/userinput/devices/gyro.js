import { paths } from "../paths";

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

export class GyroDevice {
  constructor() {
    this.hmdEuler = new THREE.Euler();
    this.hmdQuaternion = new THREE.Quaternion();
    this.prevX = this.hmdEuler.x;
    this.prevY = this.hmdEuler.y;
    this.dXBuffer = new CircularBuffer(6);
    this.dYBuffer = new CircularBuffer(6);
    this.hasPolyfill = window.webvrpolyfill;
    if (this.hasPolyfill) {
      this.vrDisplay = window.webvrpolyfill.getPolyfillDisplays()[0];
      this.frameData = new window.webvrpolyfill.constructor.VRFrameData();
    }

    this.enableGyro = window.APP.store.state.preferences.enableGyro;
    window.APP.store.addEventListener("statechanged", () => {
      this.enableGyro = window.APP.store.state.preferences.enableGyro;
    });
  }

  write(frame) {
    if (!this.enableGyro || !this.hasPolyfill || !this.vrDisplay || !this.frameData) {
      return;
    }
    const hmdEuler = this.hmdEuler;
    this.vrDisplay.getFrameData(this.frameData);
    if (this.frameData.pose.orientation !== null) {
      this.hmdQuaternion.fromArray(this.frameData.pose.orientation);
      hmdEuler.setFromQuaternion(this.hmdQuaternion, "YXZ");
    }

    // Don't use gyro values when device is lying flat
    if (hmdEuler.x < -Math.PI * 0.475) return;

    const dX = difference(hmdEuler.x, this.prevX);
    const dY = difference(hmdEuler.y, this.prevY);

    this.dXBuffer.push(Math.abs(dX) < 0.001 ? 0 : dX);
    this.dYBuffer.push(Math.abs(dY) < 0.001 ? 0 : dY);

    this.averageDeltaX = average(this.dXBuffer.items);
    this.averageDeltaY = average(this.dYBuffer.items);

    this.prevX = hmdEuler.x;
    this.prevY = hmdEuler.y;
    frame.setValueType(paths.device.gyro.averageDeltaX, this.averageDeltaX);
    frame.setValueType(paths.device.gyro.averageDeltaY, this.averageDeltaY);
  }
}
