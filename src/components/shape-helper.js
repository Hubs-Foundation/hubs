/* global Ammo */
import * as threeToAmmo from "three-to-ammo";
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

  init: function() {
    this.system = this.el.sceneEl.systems["hubs-systems"].physicsSystem;
    this.alive = true;
    this.system.registerShapeHelper(this);
  },

  init2: function() {
    this.mesh = null;

    let bodyEl = this.el;
    this.bodyHelper = bodyEl.components["body-helper"] || null;
    while (!this.bodyHelper && bodyEl.parentNode != this.el.sceneEl) {
      bodyEl = bodyEl.parentNode;
      if (bodyEl.components["body-helper"]) {
        this.bodyHelper = bodyEl.components["body-helper"];
      }
    }
    if (!this.bodyHelper || !this.bodyHelper.body) {
      console.warn("body not found");
      return;
    }
    if (this.data.fit !== FIT.MANUAL) {
      if (!this.el.object3DMap.mesh) {
        console.error("Cannot use FIT.ALL without object3DMap.mesh");
        return;
      }
      this.mesh = this.el.object3DMap.mesh;
      this.mesh.updateMatrices();
    }

    this.shapes = threeToAmmo.createCollisionShapes(this.mesh, this.data);
    for (let i = 0; i < this.shapes.length; i++) {
      this.bodyHelper.body.addShape(this.shapes[i]);
    }
  },

  remove: function() {
    if (this.shapes) {
      for (let i = 0; i < this.shapes.length; i++) {
        if (this.bodyHelper.body) {
          this.bodyHelper.body.removeShape(this.shapes[i]);
        }
        this.shapes[i].destroy();
        Ammo.destroy(this.shapes[i].localTransform);
      }
    }
    this.shapes = null;
    this.alive = false;
  }
});
