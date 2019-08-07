/* global THREE AFRAME */
const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;
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

export class TwoPointStretchingSystem {
  constructor() {
    this.initialScale = new THREE.Vector3();
  }

  tick() {
    //TODO: leftRemote
    const interaction = AFRAME.scenes[0].systems.interaction;
    const { leftHand, rightHand, rightRemote } = interaction.state;

    const stretching = leftHand.held && (leftHand.held === rightHand.held || leftHand.held === rightRemote.held);
    let leftStretcher, rightStretcher;
    if (stretching) {
      leftStretcher = interaction.options.leftHand.entity.object3D;
      rightStretcher =
        leftHand.held === rightHand.held
          ? interaction.options.rightHand.entity.object3D
          : interaction.options.rightRemote.entity.object3D;
      if (
        leftStretcher !== this.previousLeftStretcher ||
        rightStretcher !== this.previousRightStretcher ||
        leftHand.held !== this.stretched
      ) {
        this.initialStretchDistance = distanceBetweenStretchers(leftStretcher, rightStretcher);
        this.stretched = leftHand.held;
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
