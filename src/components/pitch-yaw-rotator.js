import { paths } from "../systems/userinput/paths";

const degToRad = THREE.Math.degToRad;
const radToDeg = THREE.Math.radToDeg;

AFRAME.registerComponent("pitch-yaw-rotator", {
  schema: {
    minPitch: { default: -50 },
    maxPitch: { default: 50 }
  },

  init() {
    this.pitch = 0;
    this.yaw = 0;
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
    const cameraDelta = userinput.readFrameValueAtPath(paths.actions.cameraDelta);
    if (cameraDelta) {
      this.look(cameraDelta[1], cameraDelta[0]);
    }

    this.el.object3D.rotation.set(degToRad(this.pitch), degToRad(this.yaw), 0);
    this.el.object3D.rotation.order = "YXZ";
  }
});
