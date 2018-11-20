AFRAME.registerComponent("directional-light", {
  schema: {
    color: { type: "color" },
    intensity: { default: 1.0 },
    castShadow: { default: true }
  },

  init() {
    const el = this.el;
    this.light = new THREE.DirectionalLight();
    this.light.position.set(0, 0, 0);
    this.light.target.position.set(0, 0, 1);
    this.light.add(this.light.target);
    this.light.matrixNeedsUpdate = true;
    this.el.setObject3D("directional-light", this.light);
    this.el.sceneEl.systems.light.registerLight(el);
  },

  update(prevData) {
    if (this.data.color !== prevData.color) {
      this.light.color.set(this.data.color);
    }

    if (this.data.intensity !== prevData.intensity) {
      this.light.intensity = this.data.intensity;
    }

    if (this.data.castShadow !== prevData.castShadow) {
      this.light.castShadow = this.data.castShadow;
    }
  },

  remove: function() {
    this.el.removeObject3D("directional-light");
  }
});
