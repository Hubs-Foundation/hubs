/**
 * Listens for hoverable state changes and applies a visual effect to an entity
 * @namespace interactables
 * @component hoverable-visuals
 */
AFRAME.registerComponent("hoverable-visuals", {
  init: function() {
    this.interactorOneTransform = [];
    this.interactorTwoTransform = [];
  },
  remove() {
    this.interactorOneTransform = null;
    this.interactorTwoTransform = null;
  },
  tick(time) {
    const uniforms = this.el.components["media-loader"].shaderUniforms;

    if (!uniforms) return;

    const { hoverers } = this.el.components["hoverable"];

    let interactorOne, interactorTwo;
    for (const hoverer of hoverers) {
      if (hoverer.id === "player-left-controller") {
        interactorOne = hoverer.object3D;
      } else {
        // Either the right hand or the cursor.
        interactorTwo = hoverer.object3D;
      }
    }

    if (interactorOne) {
      interactorOne.matrixWorld.toArray(this.interactorOneTransform);
    }
    if (interactorTwo) {
      interactorTwo.matrixWorld.toArray(this.interactorTwoTransform);
    }

    for (const uniform of uniforms) {
      uniform.hubsHighlightInteractorOne.value = !!interactorOne;
      uniform.hubsInteractorOneTransform.value = this.interactorOneTransform;
      uniform.hubsHighlightInteractorTwo.value = !!interactorTwo;
      uniform.hubsInteractorTwoTransform.value = this.interactorTwoTransform;
      uniform.hubsTime.value = time;
    }
  }
});
