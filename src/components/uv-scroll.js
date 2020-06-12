/**
 * Animate the UV offset of a mesh's material
 * @component uv-scroll
 */
AFRAME.registerComponent("uv-scroll", {
  schema: {
    speed: { type: "vec2", default: { x: 0, y: 0 } }
  },
  tick(_t, dt) {
    const mesh = this.el.getObject3D("mesh") || this.el.getObject3D("skinnedmesh");
    const material = mesh && mesh.material;
    if (!material || !material.map) return;
    material.map.offset.addScaledVector(this.data.speed, dt / 1000);
  }
});
