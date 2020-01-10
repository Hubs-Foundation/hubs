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

/**
 * Emits events indicating that avatar hands should be posed differently.
 * @namespace user-input
 * @component hand-controls2
 */
AFRAME.registerComponent("hand-controls2", {
  schema: { default: "left" },

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
