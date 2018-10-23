/**
 * Listens for hoverable state changes and applies a visual effect to an entity
 * @namespace interactables
 * @component hoverable-visuals
 */
AFRAME.registerComponent("hoverable-visuals", {
  init: function() {
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
  addVisual(e) {
    if (e.detail.hand.id === "cursor") return;
    const meshCount = new Set();
    const materialCount = new Set();
    this.el.object3DMap.mesh.traverse(obj => {
      if (obj.material) {
        meshCount.add(obj.uuid);
        materialCount.add(obj.material.uuid);
        obj.material.color.set("red");
      }
    });
    console.log("BPDEBUG addVisual meshCount", meshCount.size, "materialCount", materialCount.size);
  },
  removeVisual(e) {
    if (e.detail.hand.id === "cursor") return;
    this.el.object3DMap.mesh.traverse(obj => {
      if (obj.material) {
        obj.material.color.set("white");
      }
    });
  }
});
