const interactorPos = new THREE.Vector3();
const interactorPosArr = [];
/**
 * Listens for hoverable state changes and applies a visual effect to an entity
 * @namespace interactables
 * @component hoverable-visuals
 */
AFRAME.registerComponent("hoverable-visuals", {
  init: function() {
    this.uniforms = null;
    this.addVisual = this.addVisual.bind(this);
    this.removeVisual = this.removeVisual.bind(this);
  },
  play() {
    this.el.addEventListener("hover-start", this.addVisual);
    this.el.addEventListener("hover-end", this.removeVisual);
  },
  pause() {
    this.el.removeEventListener("hover-start", this.addVisual);
    this.el.removeEventListener("hover-end", this.removeVisual);
  },
  tick() {
    if (!this.uniforms) return;
    // BPDEBUG update uniforms array every tick
    this.uniforms = this.el.components["gltf-model-plus"].shaderUniforms;
    this.interactor.getWorldPosition(interactorPos);
    interactorPos.toArray(interactorPosArr);
    for (const uniform of this.uniforms) {
      uniform.hubsAttractorPosition.value = interactorPosArr;
      uniform.hubsShouldAttract.value = true;
    }
  },
  addVisual(e) {
    if (e.detail.hand.id === "cursor") return;
    this.interactor = e.detail.hand.object3D;
    this.uniforms = this.el.components["gltf-model-plus"].shaderUniforms;
  },
  removeVisual(e) {
    if (e.detail.hand.id === "cursor") return;
    if (this.uniforms) {
      for (const uniform of this.uniforms) {
        uniform.hubsShouldAttract.value = false;
      }
    }
    this.uniforms = null;
    this.interactor = null;
  }
});
