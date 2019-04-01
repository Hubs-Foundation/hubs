/* global THREE AFRAME */
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
    this.heldLeftHand = null;
    this.heldRightHand = null;
    this.heldRightRemote = null;
    this.initialScale = new THREE.Vector3();
  }

  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const { leftHand, rightHand, rightRemote } = interaction.state;

    const stretching = leftHand.held && (leftHand.held === rightHand.held || leftHand.held === rightRemote.held);
    let stretcherLeft, stretcherRight;
    if (stretching) {
      stretcherLeft = interaction.options.leftHand.entity.object3D;
      stretcherRight =
        leftHand.held === rightHand.held
          ? interaction.options.rightHand.entity.object3D
          : interaction.options.rightRemote.entity.object3D;
      if (
        this.stretcherLeft !== stretcherLeft ||
        this.stretcherRight !== stretcherRight ||
        leftHand.held !== this.stretched
      ) {
        this.initialStretchDistance = distanceBetweenStretchers(stretcherLeft, stretcherRight);
        this.stretched = leftHand.held;
        this.initialScale.copy(this.stretched.object3D.scale);
      }

      this.stretched.object3D.scale
        .copy(this.initialScale)
        .multiplyScalar(distanceBetweenStretchers(stretcherLeft, stretcherRight) / this.initialStretchDistance);
      this.stretched.object3D.matrixNeedsUpdate = true;
    }

    this.stretcherLeft = stretcherLeft;
    this.stretcherRight = stretcherRight;

    this.heldLeftHand = leftHand.held;
    this.heldRightHand = rightHand.held;
    this.heldRightRemote = rightRemote.held;
  }
}
