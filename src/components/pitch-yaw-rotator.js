import { paths } from "../systems/userinput/paths";

const rotatePitchAndYaw = (function() {
  const opq = new THREE.Quaternion();
  const owq = new THREE.Quaternion();
  const oq = new THREE.Quaternion();
  const pq = new THREE.Quaternion();
  const yq = new THREE.Quaternion();
  const right = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  return function rotatePitchAndYaw(o, p, y) {
    o.parent.getWorldQuaternion(opq);
    o.getWorldQuaternion(owq);
    oq.copy(o.quaternion);
    right.set(1, 0, 0).applyQuaternion(owq);
    pq.setFromAxisAngle(right, p);
    yq.setFromAxisAngle(UP, y);
    o.quaternion
      .copy(owq)
      .premultiply(pq)
      .premultiply(yq)
      .premultiply(opq.inverse());
    o.matrixNeedsUpdate = true;
  };
})();

AFRAME.registerComponent("pitch-yaw-rotator", {
  init() {
    this.pendingXRotation = 0;
    this.el.sceneEl.addEventListener("rotateX", e => {
      this.pendingXRotation += e.detail.value * 0.03;
    });
    this.on = true;
  },

  tick() {
    if (this.on) {
      const scene = AFRAME.scenes[0];
      const userinput = scene.systems.userinput;
      const cameraDelta = userinput.get(
        scene.is("entered") ? paths.actions.cameraDelta : paths.actions.lobbyCameraDelta
      );
      if (cameraDelta) {
        rotatePitchAndYaw(this.el.object3D, this.pendingXRotation + cameraDelta[1], cameraDelta[0]);
      } else if (this.pendingXRotation) {
        rotatePitchAndYaw(this.el.object3D, this.pendingXRotation, 0);
      }
    }
    this.pendingXRotation = 0;
  }
});
