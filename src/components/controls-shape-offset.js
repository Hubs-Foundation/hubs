import { CONTROLLER_OFFSETS } from "./hand-controls2.js";

AFRAME.registerComponent("controls-shape-offset", {
  schema: {
    additionalOffset: { default: { x: 0, y: -0.03, z: -0.04 } }
  },
  init: function() {
    this.controller = null;
    this.shapeAdded = false;

    this._handleControllerConnected = this._handleControllerConnected.bind(this);
    this.el.addEventListener("controllerconnected", this._handleControllerConnected);
  },

  remove: function() {
    this.el.removeEventListener("controllerconnected", this._handleControllerConnected);
  },

  tick: function() {
    if (!this.shapeAdded && this.controller) {
      this.shapeAdded = true;
      const hasOffset = CONTROLLER_OFFSETS.hasOwnProperty(this.controller);
      const offset = hasOffset ? CONTROLLER_OFFSETS[this.controller] : CONTROLLER_OFFSETS.default;
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      offset.decompose(position, quaternion, scale);
      position.add(this.data.additionalOffset);
      quaternion.conjugate();

      const shape = {
        shape: "sphere",
        radius: "0.02",
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
