/**
 * Listens for hoverable state changes and applies a visual effect to an entity
 * @namespace interactables
 * @component hoverable-visuals
 */
AFRAME.registerComponent("hoverable-visuals", {
  schema: {
    cursorController: { type: "selector" }
  },
  init: function() {
    // uniforms and boundingSphere are set from the component responsible for loading the mesh.
    this.uniforms = null;
    this.boundingSphere = new THREE.Sphere();

    this.interactorOneTransform = [];
    this.interactorTwoTransform = [];
    this.sweepParams = [];
  },
  remove() {
    this.uniforms = null;
    this.boundingBox = null;
    this.interactorOneTransform = null;
    this.interactorTwoTransform = null;
  },
  tick(time) {
    if (!this.uniforms) return;

    const { hoverers } = this.el.components["hoverable"];

    let interactorOne, interactorTwo;
    for (const hoverer of hoverers) {
      if (hoverer.id === "player-left-controller") {
        interactorOne = hoverer.object3D;
      } else if (hoverer.id === "cursor") {
        if (this.data.cursorController.components["cursor-controller"].enabled) {
          interactorTwo = hoverer.object3D;
        }
      } else {
        interactorTwo = hoverer.object3D;
      }
    }

    if (interactorOne) {
      interactorOne.matrixWorld.toArray(this.interactorOneTransform);
    }
    if (interactorTwo) {
      interactorTwo.matrixWorld.toArray(this.interactorTwoTransform);
    }

    if (interactorOne || interactorTwo) {
      const worldY = this.el.object3D.matrixWorld.elements[13];
      const scaledRadius = this.el.object3D.scale.y * this.boundingSphere.radius;
      this.sweepParams[0] = worldY - scaledRadius;
      this.sweepParams[1] = worldY + scaledRadius;
    }

    for (const uniform of this.uniforms) {
      uniform.hubs_EnableSweepingEffect.value = true;
      uniform.hubs_SweepParams.value = this.sweepParams;
      uniform.hubs_HighlightInteractorOne.value = !!interactorOne;
      uniform.hubs_InteractorOneTransform.value = this.interactorOneTransform;
      uniform.hubs_HighlightInteractorTwo.value = !!interactorTwo;
      uniform.hubs_InteractorTwoTransform.value = this.interactorTwoTransform;
      uniform.hubs_Time.value = time;
    }
  }
});
