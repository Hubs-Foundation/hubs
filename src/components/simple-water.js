import { SimpleWaterMesh } from "../objects/SimpleWaterMesh";

function vec2Equals(a, b) {
  return a && b && a.x === b.x && a.y === b.y;
}

AFRAME.registerComponent("simple-water", {
  schema: {
    opacity: { type: "number", default: 1 },
    color: { type: "color" },
    tideHeight: { type: "number", default: 0.01 },
    tideScale: { type: "vec2", default: { x: 1, y: 1 } },
    tideSpeed: { type: "vec2", default: { x: 0.5, y: 0.5 } },
    waveHeight: { type: "number", default: 0.1 },
    waveScale: { type: "vec2", default: { x: 1, y: 20 } },
    waveSpeed: { type: "vec2", default: { x: 0.05, y: 6 } },
    ripplesScale: { type: "number", default: 1 },
    ripplesSpeed: { type: "number", default: 0.25 }
  },

  init() {
    const usePhongShader = APP.store.state.preferences.materialQualitySetting !== "high";
    this.water = new SimpleWaterMesh({ lowQuality: usePhongShader });
    this.el.setObject3D("mesh", this.water);
  },

  update(oldData) {
    if (this.data.opacity !== oldData.opacity) {
      this.water.opacity = this.data.opacity;
    }

    if (this.data.color !== oldData.color) {
      this.water.color.set(this.data.color);
    }

    if (this.data.tideHeight !== oldData.tideHeight) {
      this.water.tideHeight = this.data.tideHeight;
    }

    if (!vec2Equals(this.data.tideScale, oldData.tideScale)) {
      this.water.tideScale.copy(this.data.tideScale);
    }

    if (!vec2Equals(this.data.tideSpeed, oldData.tideSpeed)) {
      this.water.tideSpeed.copy(this.data.tideSpeed);
    }

    if (this.data.waveHeight !== oldData.waveHeight) {
      this.water.waveHeight = this.data.waveHeight;
    }

    if (!vec2Equals(this.data.waveScale, oldData.waveScale)) {
      this.water.waveScale.copy(this.data.waveScale);
    }

    if (!vec2Equals(this.data.waveSpeed, oldData.waveSpeed)) {
      this.water.waveSpeed.copy(this.data.waveSpeed);
    }

    if (this.data.ripplesScale !== oldData.ripplesScale) {
      this.water.ripplesScale = this.data.ripplesScale;
    }

    if (this.data.ripplesSpeed !== oldData.ripplesSpeed) {
      this.water.ripplesSpeed = this.data.ripplesSpeed;
    }
  },

  tick(time) {
    this.water.update(time / 1000);
  },

  remove() {
    const mesh = this.el.getObject3D("mesh");
    mesh.geometry.dispose();
    mesh.material.dispose();
    this.el.removeObject3D("mesh");
  }
});
