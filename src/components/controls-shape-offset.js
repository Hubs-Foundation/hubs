import { LEFT_CONTROLLER_OFFSETS, RIGHT_CONTROLLER_OFFSETS } from "./hand-controls2.js";

/**
 * Sets the offset of the aframe-physics shape on this entity based on the current VR controller type
 * @namespace user-input
 * @component controls-shape-offset
 */
AFRAME.registerComponent("controls-shape-offset", {
  schema: {
    additionalOffset: { type: "vec3", default: { x: 0, y: 0, z: -0.04 } }
  },
  init: function() {
    this.controller = null;
    this.shapeAdded = false;
    this.isLeft = this.el.getAttribute("hand-controls2") === "left";

    this._handleControllerConnected = this._handleControllerConnected.bind(this);
    this.el.addEventListener("controllerconnected", this._handleControllerConnected);
  },

  remove: function() {
    this.el.removeEventListener("controllerconnected", this._handleControllerConnected);
  },

  tick: function() {
    if (!this.shapeAdded && this.controller) {
      this.shapeAdded = true;
      const offsets = this.isLeft ? LEFT_CONTROLLER_OFFSETS : RIGHT_CONTROLLER_OFFSETS;
      const hasOffset = offsets.hasOwnProperty(this.controller);
      const offset = hasOffset ? offsets[this.controller] : offsets.default;
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      offset.decompose(position, quaternion, scale);
      position.add(this.data.additionalOffset);
      quaternion.conjugate();

      const shape = {
        shape: "box",
        halfExtents: { x: 0.03, y: 0.04, z: 0.05 },
        orientation: quaternion,
        offset: position
      };

      this.el.setAttribute("shape", shape);
    }
  },

  _handleControllerConnected: function(e) {
    this.controller = e.detail.name;
  }
});
