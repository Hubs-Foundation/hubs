import { paths } from "../systems/userinput/paths";

const POSES = {
  open: "open",
  point: "point",
  fist: "fist",
  hold: "hold",
  thumbUp: "thumbUp",
  thumbDown: "thumbDown",
  indexDown: "indexDown",
  pinch: "pinch",
  mrpDown: "mrpDown"
};

export const LEFT_CONTROLLER_OFFSETS = {
  default: new THREE.Matrix4(),
  "oculus-touch-controls": new THREE.Matrix4().makeTranslation(-0.025, -0.03, 0.1),
  "oculus-go-controls": new THREE.Matrix4(),
  "vive-controls": new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0, 0.13),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-40 * THREE.Math.DEG2RAD, 0, 0)),
    new THREE.Vector3(1, 1, 1)
  ),
  "windows-motion-controls": new THREE.Matrix4().compose(
    new THREE.Vector3(0, -0.017, 0.13),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-40 * THREE.Math.DEG2RAD, 0, 0)),
    new THREE.Vector3(1, 1, 1)
  ),
  "daydream-controls": new THREE.Matrix4().makeTranslation(0, 0, -0.04),
  "gearvr-controls": new THREE.Matrix4()
};

export const RIGHT_CONTROLLER_OFFSETS = {
  default: new THREE.Matrix4(),
  "oculus-touch-controls": new THREE.Matrix4().makeTranslation(0.025, -0.03, 0.1),
  "oculus-go-controls": new THREE.Matrix4(),
  "vive-controls": new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0, 0.13),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-40 * THREE.Math.DEG2RAD, 0, 0)),
    new THREE.Vector3(1, 1, 1)
  ),
  "windows-motion-controls": new THREE.Matrix4().compose(
    new THREE.Vector3(0, -0.017, 0.13),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-40 * THREE.Math.DEG2RAD, 0, 0)),
    new THREE.Vector3(1, 1, 1)
  ),
  "daydream-controls": new THREE.Matrix4().makeTranslation(0, 0, -0.04),
  "gearvr-controls": new THREE.Matrix4()
};

/**
 * Emits events indicating that avatar hands should be posed differently.
 * @namespace user-input
 * @component hand-controls2
 */
AFRAME.registerComponent("hand-controls2", {
  schema: { default: "left" },

  getLeftControllerOffset() {
    if (LEFT_CONTROLLER_OFFSETS[this.connectedController] === undefined) {
      return LEFT_CONTROLLER_OFFSETS.default;
    }
    return LEFT_CONTROLLER_OFFSETS[this.connectedController];
  },

  getRightControllerOffset() {
    if (RIGHT_CONTROLLER_OFFSETS[this.connectedController] === undefined) {
      return RIGHT_CONTROLLER_OFFSETS.default;
    }
    return RIGHT_CONTROLLER_OFFSETS[this.connectedController];
  },

  init() {
    this.pose = POSES.open;
  },

  poseForFingers(thumb, index, middleRingPinky) {
    if (!thumb && !index && !middleRingPinky) {
      return POSES.open;
    } else if (thumb && index && middleRingPinky) {
      return POSES.fist;
    } else if (!thumb && index && middleRingPinky) {
      return POSES.thumbUp;
    } else if (!thumb && !index && middleRingPinky) {
      return POSES.mrpDown;
    } else if (!thumb && index && !middleRingPinky) {
      return POSES.indexDown;
    } else if (thumb && !index && !middleRingPinky) {
      return POSES.thumbDown;
    } else if (thumb && index && !middleRingPinky) {
      return POSES.pinch;
    } else if (thumb && !index && middleRingPinky) {
      return POSES.point;
    }

    console.warn(`Did not find matching pose for thumb ${thumb}, index ${index}, middleRingPinky ${middleRingPinky}`);
    return POSES.open;
  },

  tick() {
    const hand = this.data;
    const userinput = AFRAME.scenes[0].systems.userinput;
    const shouldBeVisible = userinput.get(
      hand === "left" ? paths.actions.leftHand.matrix : paths.actions.rightHand.matrix
    );
    if (this.el.object3D.visible !== shouldBeVisible) {
      this.el.setAttribute("visible", shouldBeVisible);
    }
    const subpath = hand === "left" ? paths.actions.leftHand : paths.actions.rightHand;
    const thumb = userinput.get(subpath.thumb);
    const index = userinput.get(subpath.index);
    const middleRingPinky = userinput.get(subpath.middleRingPinky);
    const pose = this.poseForFingers(thumb, index, middleRingPinky);
    if (pose !== this.pose) {
      this.el.emit("hand-pose", { previous: this.pose, current: pose });
      this.pose = pose;
    }
  }
});
