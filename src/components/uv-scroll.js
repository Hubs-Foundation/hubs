/**
 * Animate the UV offset of a mesh's material
 * @component uv-scroll
 */
AFRAME.registerComponent("uv-scroll", {
  schema: {
    speed: { type: "vec2", default: { x: 0, y: 0 } },
    animateBase: { type: "boolean", default: true },
    animateEmissive: { type: "boolean", default: true },
    animateNormal: { type: "boolean", default: false },
    animateAO: { type: "boolean", default: false },
    animateRoughness: { type: "boolean", default: false },
    animateMetalness: { type: "boolean", default: false },
    animateLightmap: { type: "boolean", default: false }
  },
  init() {
    this.offset = new THREE.Vector2();
  },
  tick(_t, dt) {
    const material = this.el.getObject3D("mesh") && this.el.getObject3D("mesh").material;
    if (!material) return;

    this.offset.addScaledVector(this.data.speed, dt / 1000);
    this.data.animateBase && material.map && material.map.offset.copy(this.offset);
    this.data.animateEmissive && material.emissiveMap && material.emissiveMap.offset.copy(this.offset);
    this.data.animateNormal && material.normalMap && material.normalMap.offset.copy(this.offset);
    this.data.animateAO && material.aoMap && material.aoMap.offset.coyp(this.offset);
    this.data.animateRoughness && material.roughnessMap && material.roughnessMap.offset.copy(this.offset);
    this.data.animateMetalness && material.metalnessMap && material.metalnessMap.offset.copy(this.offset);
    this.data.animateLightmap && material.lightMap && material.lightMap.offset.copy(this.offset);
  }
});
