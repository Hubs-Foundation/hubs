import { paths } from "../systems/userinput/paths";

const degToRad = THREE.Math.degToRad;
const radToDeg = THREE.Math.radToDeg;

const rotatePitchAndYaw = (function() {
  const opq = new THREE.Quaternion();
  const owq = new THREE.Quaternion();
  const oq = new THREE.Quaternion();
  const pq = new THREE.Quaternion();
  const yq = new THREE.Quaternion();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const q = new THREE.Quaternion();
  return function rotatePitchAndYaw(o, p, y) {
    o.parent.getWorldQuaternion(opq);
    o.getWorldQuaternion(owq);
    oq.copy(o.quaternion);
    right.set(1,0,0).applyQuaternion(owq);
    pq.setFromAxisAngle(right, p);

    up.set(0, 1, 0);
    yq.setFromAxisAngle(up, y);

    q.copy(owq).premultiply(pq).premultiply(yq).premultiply(opq.inverse());

    //o.parent.getWorldQuaternion(opq);
    //q.multiply(opq.inverse());
    o.quaternion.copy(q);
    o.matrixNeedsUpdate = true;
  };
})();

AFRAME.registerComponent("pitch-yaw-rotator", {
  schema: {
    minPitch: { default: -90 },
    maxPitch: { default: 90 }
  },

  init() {
    this.pitch = 0;
    this.yaw = 0;
    this.onRotateX = this.onRotateX.bind(this);
    this.el.sceneEl.addEventListener("rotateX", this.onRotateX);
    this.pendingXRotation = 0;
    this.on = true;
    this.el.object3D.rotation.order = "YXZ";
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
    if (!this.on) {
      this.pendingXRotation = 0;
      return;
    }
    const scene = AFRAME.scenes[0];
    const userinput = scene.systems.userinput;
    const cameraDelta = userinput.get(scene.is("entered") ? paths.actions.cameraDelta : paths.actions.lobbyCameraDelta);
    let lookX = this.pendingXRotation;
    let lookY = 0;
    if (cameraDelta) {
      lookY += cameraDelta[0];
      lookX += cameraDelta[1];
    }
    if (lookX !== 0 || lookY !== 0) {
      this.look(lookX, lookY);
      rotatePitchAndYaw(this.el.object3D, this.pitch, this.yaw);
      this.pitch = 0;
      this.yaw = 0;
      //this.el.object3D.rotation.set(degToRad(this.pitch), degToRad(this.yaw), 0);
      //this.el.object3D.rotation.order = "YXZ";
    }
    this.pendingXRotation = 0;
  }
});
