AFRAME.registerComponent("spot-light", {
  schema: {
    color: { type: "color" },
    intensity: { default: 1.0 },
    range: { default: 0 },
    innerConeAngle: { default: 0 },
    outerConeAngle: { default: Math.PI / 4.0 },
    castShadow: { default: true }
  },

  init() {
    const el = this.el;
    this.light = new THREE.SpotLight();
    this.light.position.set(0, 0, 0);
    this.light.target.position.set(0, 0, 1);
    this.light.add(this.light.target);
    this.light.decay = 2;
    this.light.matrixNeedsUpdate = true;
    this.light.target.matrixNeedsUpdate = true;
    this.el.setObject3D("spot-light", this.light);
    this.el.sceneEl.systems.light.registerLight(el);
  },

  update(prevData) {
    if (this.data.color !== prevData.color) {
      this.light.color.set(this.data.color);
    }

    if (this.data.intensity !== prevData.intensity) {
      this.light.intensity = this.data.intensity;
    }

    if (this.data.range !== prevData.range) {
      this.light.distance = this.data.range;
    }

    if (this.data.innerConeAngle !== prevData.innerConeAngle || this.data.outerConeAngle !== prevData.outerConeAngle) {
      this.light.angle = this.data.outerConeAngle;
      this.light.penumbra = 1.0 - this.data.innerConeAngle / this.data.outerConeAngle;
    }

    if (this.data.castShadow !== prevData.castShadow) {
      this.light.castShadow = this.data.castShadow;
    }
  },

  remove: function() {
    this.el.removeObject3D("spot-light");
  }
});
