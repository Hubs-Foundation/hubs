// This is based largely on: @lojjic https://github.com/lojjic/aframe-troika-text/blob/master/src/aframe-troika-text-component.js
// but has been made functional and restyled for Mozilla Hubs (hubs.mozilla.com)
// by @jamesckane at Paradowski Creative (paradowski.com)

import { Text } from "troika-three-text";

// Mark this type of object so we can filter in from our shader patching
Text.prototype.isTroikaText = true;

const THREE_SIDES = {
  front: THREE.FrontSide,
  back: THREE.BackSide,
  double: THREE.DoubleSide
};

function numberOrPercent(defaultValue) {
  return {
    default: defaultValue,
    parse: function(value) {
      if (typeof value === "string" && value.indexOf("%") > 0) {
        return value;
      }
      value = +value;
      return isNaN(value) ? 0 : value;
    },
    stringify: function(value) {
      return "" + value;
    }
  };
}

AFRAME.registerComponent("text", {
  schema: {
    textAlign: { type: "string", default: "left", oneOf: ["left", "right", "center", "justify"] },
    anchorX: { default: "center", oneOf: ["left", "right", "center"] },
    anchorY: { default: "middle", oneOf: ["top", "top-baseline", "middle", "bottom-baseline", "bottom"] },
    clipRect: {
      type: "string",
      default: "",
      parse: function(value) {
        if (value) {
          value = value.split(/[\s,]+/).reduce(function(out, val) {
            val = +val;
            if (!isNaN(val)) {
              out.push(val);
            }
            return out;
          }, []);
        }
        return value && value.length === 4 ? value : null;
      },
      stringify: function(value) {
        return value ? value.join(" ") : "";
      }
    },
    color: { type: "color", default: "#FFF" },
    curveRadius: { type: "number", default: 0 },
    depthOffset: { type: "number", default: 0 },
    direction: { type: "string", default: "auto", oneOf: ["auto", "ltr", "rtl"] },
    fillOpacity: { type: "number", default: 1 },
    // This is different from the Troika preoperty name, Using "fontUrl" to prevent conflict with previous "font" property and to allow us to make named fonts later
    fontUrl: { type: "string" },
    // This default value differs from the Troika default of 0.1, it most closely matches the size of our previous text component.
    fontSize: { type: "number", default: 0.075 },
    letterSpacing: { type: "number", default: 0 },
    lineHeight: { type: "number" },
    maxWidth: { type: "number", default: Infinity },
    outlineBlur: numberOrPercent(0),
    outlineColor: { type: "color", default: "#000" },
    outlineOffsetX: numberOrPercent(0),
    outlineOffsetY: numberOrPercent(0),
    outlineOpacity: { type: "number", default: 1 },
    outlineWidth: numberOrPercent(0),
    overflowWrap: { type: "string", default: "normal", oneOf: ["normal", "break-word"] },
    strokeColor: { type: "color", default: "grey" },
    strokeOpacity: { type: "number", default: 1 },
    strokeWidth: numberOrPercent(0),
    // Note this is different than the Troika property name, Using "value" instead of "text" here to prevent code changes.
    value: { type: "string", default: "" },
    textIndent: { type: "number", default: 0 },
    whiteSpace: { default: "normal", oneOf: ["normal", "nowrap"] },
    opacity: { type: "number", default: 1.0 },
    side: { default: "front", oneOf: ["front", "back", "double"] }
  },

  /**
   * Called once when component is attached for initial setup.
   */
  init: function() {
    this.troikaTextMesh = new Text();
    this.troikaTextMesh.material.toneMapped = false;
    this.el.setObject3D("text", this.troikaTextMesh);
  },

  /**
   * Called when component is attached and when component data changes.
   * Generally modifies the entity based on the data.
   */
  update: function() {
    const data = this.data;
    const mesh = this.troikaTextMesh;

    // Update the text mesh
    mesh.text = data.value || "";
    mesh.textAlign = data.textAlign;
    mesh.anchorX = data.anchorX;
    mesh.anchorY = data.anchorY;
    mesh.color = data.color;
    mesh.material.side = THREE_SIDES[data.side];
    mesh.material.opacity = data.opacity;
    mesh.curveRadius = data.curveRadius;
    mesh.depthOffset = data.depthOffset || 0;
    mesh.direction = data.direction;
    mesh.fillOpacity = data.fillOpacity;
    mesh.font = data.fontUrl;
    mesh.fontSize = data.fontSize;
    mesh.letterSpacing = data.letterSpacing || 0;
    mesh.clipRect = data.clipRect;
    mesh.lineHeight = data.lineHeight || "normal";
    mesh.outlineBlur = data.outlineBlur;
    mesh.outlineColor = data.outlineColor;
    mesh.outlineOffsetX = data.outlineOffsetX;
    mesh.outlineOffsetY = data.outlineOffsetY;
    mesh.outlineOpacity = data.outlineOpacity;
    mesh.outlineWidth = data.outlineWidth;
    mesh.overflowWrap = data.overflowWrap;
    mesh.strokeColor = data.strokeColor;
    mesh.strokeOpacity = data.strokeOpacity;
    mesh.strokeWidth = data.strokeWidth;
    mesh.textIndent = data.textIndent;
    mesh.whiteSpace = data.whiteSpace;
    mesh.maxWidth = data.maxWidth;
    mesh.sync(() => {
      this.el.emit("text-updated", this);
    });
  },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function() {
    // Free memory
    this.troikaTextMesh.dispose();
  },

  getSize: (function() {
    const size = new THREE.Vector3();
    return function(outSize) {
      this.troikaTextMesh.geometry.boundingBox.getSize(size);
      outSize.set(
        size.x * this.troikaTextMesh.scale.x,
        size.y * this.troikaTextMesh.scale.y,
        size.z * this.troikaTextMesh.scale.z
      );
    };
  })()
});
