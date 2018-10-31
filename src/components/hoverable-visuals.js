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
    // uniforms are set from the component responsible for loading the mesh.
    this.uniforms = null;
    this.interactorOneTransform = [];
    this.interactorTwoTransform = [];
  },
  remove() {
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

    for (const uniform of this.uniforms) {
      uniform.hubs_HighlightInteractorOne.value = !!interactorOne;
      uniform.hubs_InteractorOneTransform.value = this.interactorOneTransform;
      uniform.hubs_HighlightInteractorTwo.value = !!interactorTwo;
      uniform.hubs_InteractorTwoTransform.value = this.interactorTwoTransform;
      uniform.hubs_Time.value = time;
    }
  }
});
