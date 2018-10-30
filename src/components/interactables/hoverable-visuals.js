/**
 * Listens for hoverable state changes and applies a visual effect to an entity
 * @namespace interactables
 * @component hoverable-visuals
 */
AFRAME.registerComponent("hoverable-visuals", {
  init: function() {
    this.uniforms = [];
    this.addVisual = this.addVisual.bind(this);
    this.removeVisual = this.removeVisual.bind(this);
    this.interactorOneTransform = [];
    this.interactorTwoTransform = [];
  },
  play() {
    this.el.addEventListener("hover-start", this.addVisual);
    this.el.addEventListener("hover-end", this.removeVisual);
  },
  pause() {
    this.el.removeEventListener("hover-start", this.addVisual);
    this.el.removeEventListener("hover-end", this.removeVisual);
    this.uniforms = [];
    this.interactorOne = null;
    this.interactorTwo = null;
  },
  tick() {
    if (!this.uniforms) return;

    if (this.interactorOne) {
      this.interactorOne.matrixWorld.toArray(this.interactorOneTransform);
    }
    if (this.interactorTwo) {
      this.interactorTwo.matrixWorld.toArray(this.interactorTwoTransform);
    }

    for (const uniform of this.uniforms) {
      uniform.hubsHighlightInteractorOne.value = !!this.interactorOne;
      uniform.hubsInteractorOneTransform.value = this.interactorOneTransform;
      uniform.hubsHighlightInteractorTwo.value = !!this.interactorTwo;
      uniform.hubsInteractorTwoTransform.value = this.interactorTwoTransform;
    }
  },
  addVisual(e) {
    if (e.detail.hand.id === "cursor") return;
    if (e.detail.hand.id === "player-left-controller") {
      this.interactorOne = e.detail.hand.object3D;
    } else {
      this.interactorTwo = e.detail.hand.object3D;
    }
    this.uniforms = this.el.components["gltf-model-plus"].shaderUniforms;
  },
  removeVisual(e) {
    if (e.detail.hand.id === "cursor") return;
    if (e.detail.hand.id === "player-left-controller") {
      this.interactorOne = null;
    } else {
      this.interactorTwo = null;
    }
  }
});
