AFRAME.registerComponent("spot-light", {
  schema: {
    color: { type: "color" },
    intensity: { default: 1.0 },
    range: { default: 0 },
    decay: { default: 2 },
    innerConeAngle: { default: 0 },
    outerConeAngle: { default: Math.PI / 4.0 },
    castShadow: { default: true },
    shadowMapResolution: { default: [512, 512] },
    shadowBias: { default: 0 },
    shadowRadius: { default: 1 }
  },

  init() {
    this.light = new THREE.SpotLight();
    this.light.position.set(0, 0, 0);
    this.light.target.position.set(0, 0, 1);
    this.light.add(this.light.target);
    this.light.matrixNeedsUpdate = true;
    this.light.target.matrixNeedsUpdate = true;
    this.el.setObject3D("spot-light", this.light);
  },

  update(prevData) {
    const light = this.light;

    if (this.data.color !== prevData.color) {
      light.color.set(this.data.color);
    }

    if (this.data.intensity !== prevData.intensity) {
      light.intensity = this.data.intensity;
    }

    if (this.data.range !== prevData.range) {
      light.distance = this.data.range;
    }

    if (this.data.decay !== prevData.decay) {
      light.decay = this.data.decay;
    }

    if (this.data.innerConeAngle !== prevData.innerConeAngle || this.data.outerConeAngle !== prevData.outerConeAngle) {
      light.angle = this.data.outerConeAngle;
      light.penumbra = 1.0 - this.data.innerConeAngle / this.data.outerConeAngle;
    }

    if (this.data.castShadow !== prevData.castShadow) {
      light.castShadow = this.data.castShadow;
    }

    if (this.data.shadowBias !== prevData.shadowBias) {
      light.shadow.bias = this.data.shadowBias;
    }

    if (this.data.shadowRadius !== prevData.shadowRadius) {
      light.shadow.radius = this.data.shadowRadius;
    }

    const [width, height] = this.data.shadowMapResolution;
    const [prevWidth, prevHeight] = prevData.shadowMapResolution ? prevData.shadowMapResolution : [512, 512];

    if (width !== prevWidth || height !== prevHeight) {
      light.shadow.mapSize.set(width, height);

      if (light.shadow.map) {
        light.shadow.map.dispose();
        light.shadow.map = null;
      }
    }
  },

  remove: function() {
    this.el.removeObject3D("spot-light");
  }
});
