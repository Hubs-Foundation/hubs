import { paths } from "../systems/userinput/paths";

const degToRad = THREE.Math.degToRad;
const radToDeg = THREE.Math.radToDeg;

AFRAME.registerComponent("pitch-yaw-rotator", {
  schema: {
    minPitch: { default: -65 },
    maxPitch: { default: 65 }
  },

  init() {
    this.pitch = 0;
    this.yaw = 0;
    this.onRotateX = this.onRotateX.bind(this);
    this.el.sceneEl.addEventListener("rotateX", this.onRotateX);
    this.pendingXRotation = 0;
  },

  onRotateX(e) {
    this.pendingXRotation += e.detail.value;
  },

  look(deltaPitch, deltaYaw) {
    const { minPitch, maxPitch } = this.data;
    this.pitch += deltaPitch;
    this.pitch = THREE.Math.clamp(this.pitch, minPitch, maxPitch);
    this.yaw += deltaYaw;
  },

  set(pitch, yaw) {
    const { minPitch, maxPitch } = this.data;
    this.pitch = THREE.Math.clamp(radToDeg(pitch), minPitch, maxPitch);
    this.yaw = radToDeg(yaw);
  },

  tick() {
    const userinput = AFRAME.scenes[0].systems.userinput;
    const cameraDelta = userinput.get(paths.actions.cameraDelta);
    let lookX = this.pendingXRotation;
    let lookY = 0;
    if (cameraDelta) {
      lookY += cameraDelta[0];
      lookX += cameraDelta[1];
    }
    if (lookX !== 0 || lookY !== 0) {
      this.look(lookX, lookY);
      this.el.object3D.rotation.set(degToRad(this.pitch), degToRad(this.yaw), 0);
      this.el.object3D.rotation.order = "YXZ";
    }
    this.pendingXRotation = 0;
  }
});
