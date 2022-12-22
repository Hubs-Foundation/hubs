import { COLLISION_LAYERS } from "../constants";
const COLLISION_FILTER_MASK_HANDS = { collisionFilterMask: COLLISION_LAYERS.HANDS };
export const distanceBetweenStretchers = (() => {
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return function distanceBetweenStretchers(obj1, obj2) {
    obj1.getWorldPosition(a);
    obj2.getWorldPosition(b);
    return a.distanceTo(b);
  };
})();

function existsAndHeldInEither(object, holderA, holderB) {
  return object && (object === holderA.held || object === holderB.held);
}

export class TwoPointStretchingSystem {
  constructor() {
    this.initialScale = new THREE.Vector3();
  }

  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    if (!interaction.ready) return; //DOMContentReady workaround
    const { leftHand, rightHand, rightRemote, leftRemote } = interaction.state;

    const stretching =
      existsAndHeldInEither(leftHand.held, rightHand, rightRemote) ||
      existsAndHeldInEither(leftRemote.held, rightHand, rightRemote);
    const stretched = leftHand.held || leftRemote.held;
    let leftStretcher, rightStretcher;
    if (stretching) {
      leftStretcher = leftHand.held
        ? interaction.options.leftHand.entity.object3D
        : interaction.options.leftRemote.entity.object3D;
      rightStretcher = rightHand.held
        ? interaction.options.rightHand.entity.object3D
        : interaction.options.rightRemote.entity.object3D;
      if (
        leftStretcher !== this.previousLeftStretcher ||
        rightStretcher !== this.previousRightStretcher ||
        stretched !== this.stretched
      ) {
        this.initialStretchDistance = distanceBetweenStretchers(leftStretcher, rightStretcher);
        this.stretched = stretched;
        this.initialScale.copy(this.stretched.object3D.scale);
        if (this.stretched.components["ammo-body"]) {
          this.stretched.setAttribute("ammo-body", COLLISION_FILTER_MASK_HANDS);
        }
      }

      this.stretched.object3D.scale
        .copy(this.initialScale)
        .multiplyScalar(distanceBetweenStretchers(leftStretcher, rightStretcher) / this.initialStretchDistance);
      this.stretched.object3D.matrixNeedsUpdate = true;
    }

    this.previousLeftStretcher = leftStretcher;
    this.previousRightStretcher = rightStretcher;
  }
}
