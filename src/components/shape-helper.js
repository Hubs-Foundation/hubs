import { SHAPE, FIT } from "three-ammo/constants";

AFRAME.registerComponent("shape-helper", {
  schema: {
    type: {
      default: SHAPE.HULL,
      oneOf: [
        SHAPE.BOX,
        SHAPE.CYLINDER,
        SHAPE.SPHERE,
        SHAPE.CAPSULE,
        SHAPE.CONE,
        SHAPE.HULL,
        SHAPE.HACD,
        SHAPE.VHACD,
        SHAPE.MESH,
        SHAPE.HEIGHTFIELD
      ]
    },
    fit: { default: FIT.ALL, oneOf: [FIT.ALL, FIT.MANUAL] },
    halfExtents: { type: "vec3", default: { x: 1, y: 1, z: 1 } },
    minHalfExtent: { default: 0 },
    maxHalfExtent: { default: Number.POSITIVE_INFINITY },
    sphereRadius: { default: NaN },
    cylinderAxis: { default: "y", oneOf: ["x", "y", "z"] },
    margin: { default: 0.01 },
    offset: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
    orientation: { type: "vec4", default: { x: 0, y: 0, z: 0, w: 1 } },
    heightfieldData: { default: [] },
    heightfieldDistance: { default: 1 },
    includeInvisible: { default: false }
  },

  multiple: true,

  init: function () {
    this.system = this.el.sceneEl.systems["hubs-systems"].physicsSystem;
    this.uuid = -1;
    this.mesh = null;

    let bodyEl = this.el;
    this.bodyHelper = bodyEl.components["body-helper"] || null;
    while (!this.bodyHelper && bodyEl.parentNode != this.el.sceneEl) {
      bodyEl = bodyEl.parentNode;
      if (bodyEl.components["body-helper"]) {
        this.bodyHelper = bodyEl.components["body-helper"];
      }
    }
    if (!this.bodyHelper || this.bodyHelper.uuid === null || this.bodyHelper.uuid === undefined) {
      console.error("body not found");
      return;
    }
    if (this.data.fit === FIT.ALL) {
      if (!this.el.object3DMap.mesh) {
        console.error("Cannot use FIT.ALL without object3DMap.mesh");
        return;
      }
      this.mesh = this.el.object3DMap.mesh;
      this.mesh.updateMatrices();
    }

    this.uuid = this.system.addShapes(this.bodyHelper.uuid, this.mesh, this.data);
  },

  remove: function () {
    // Removing a body already cleans up it's shapes
    if (this.uuid !== -1 && this.bodyHelper.alive) {
      this.system.removeShapes(this.bodyHelper.uuid, this.uuid);
    }
  }
});
