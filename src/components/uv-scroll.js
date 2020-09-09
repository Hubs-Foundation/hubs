const textureToData = new Map();
const registeredTextures = [];

export class UVScrollSystem {
  tick(dt) {
    for (let i = 0; i < registeredTextures.length; i++) {
      const map = registeredTextures[i];
      const { offset, instances } = textureToData.get(map);
      const { component } = instances[0];

      offset.addScaledVector(component.data.speed, dt / 1000);

      const increment = component.data.increment;
      map.offset.x = increment.x ? offset.x - (offset.x % increment.x) : offset.x;
      map.offset.y = increment.y ? offset.y - (offset.y % increment.y) : offset.y;
    }
  }
}

/**
 * Animate the UV offset of a mesh's material
 * @component uv-scroll
 */
AFRAME.registerComponent("uv-scroll", {
  schema: {
    speed: { type: "vec2", default: { x: 0, y: 0 } },
    increment: { type: "vec2", default: { x: 0, y: 0 } }
  },
  play() {
    const mesh = this.el.getObject3D("mesh") || this.el.getObject3D("skinnedmesh");
    const material = mesh && mesh.material;
    if (material) {
      // We store mesh here instead of the material directly because we end up swapping out the material in injectCustomShaderChunks.
      // We need material in the first place because of MobileStandardMaterial
      const instance = { component: this, mesh };

      this.instance = instance;
      this.map = material.map;

      if (!textureToData.has(material.map)) {
        textureToData.set(material.map, {
          offset: new THREE.Vector2(),
          instances: [instance]
        });
        registeredTextures.push(material.map);
      } else {
        console.warn(
          "Multiple uv-scroll instances added to objects sharing a texture, only the speed/increment from the first one will have any effect"
        );
        textureToData.get(material.map).instances.push(instance);
      }
    }
  },

  pause() {
    if (this.map) {
      const instances = textureToData.get(this.map).instances;
      instances.splice(instances.indexOf(this.instance), 1);
      // If this was the last uv-scroll component for a given texture
      if (!instances.length) {
        textureToData.delete(this.map);
        registeredTextures.splice(registeredTextures.indexOf(this.map), 1);
      }
    }
  }
});
