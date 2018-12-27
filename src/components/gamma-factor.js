AFRAME.registerComponent("gamma-factor", {
  schema: {
    gammaFactor: { type: "number", default: 2.2 }
  },

  init() {
    const el = this.el;

    if (!el.isScene) {
      console.warn("gamma-factor component can only be applied to <a-scene>");
    }
  },

  update(prevData) {
    const data = this.data;
    const sceneEl = this.el;
    const renderer = sceneEl.renderer;
    let needsShaderUpdate = false;

    if (data.gammaFactor !== prevData.gammaFactor) {
      renderer.gammaFactor = data.gammaFactor;
      needsShaderUpdate = true;
    }

    if (!needsShaderUpdate || sceneEl.time === 0) {
      return;
    }

    sceneEl.object3D.traverse(function(node) {
      if (!node.isMesh) {
        return;
      }

      if (Array.isArray(node.material)) {
        node.material.forEach(function(material) {
          material.needsUpdate = true;
        });
      } else {
        node.material.needsUpdate = true;
      }
    });
  }
});
