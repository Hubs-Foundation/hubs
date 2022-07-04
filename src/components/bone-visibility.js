/**
 * Scales an object to near-zero if the object is invisible. Useful for bones representing avatar body parts.
 * @namespace avatar
 * @component bone-visibility
 */

const HIDDEN_SCALE = 0.00000001;

const components = [];
export class BoneVisibilitySystem {
  tick() {
    for (let i = 0; i < components.length; i++) {
      const cmp = components[i];
      const obj = cmp.el.object3D;
      const { visible, scale } = obj;
      const { updateWhileInvisible } = cmp.data;
      if (visible !== cmp.lastVisible || updateWhileInvisible) {
        if (visible && (scale.x !== 1 || scale.y !== 1 || scale.z !== 1)) {
          scale.setScalar(1);
          obj.matrixNeedsUpdate = true;
        } else if (!visible && (scale.x !== HIDDEN_SCALE || scale.y !== HIDDEN_SCALE || scale.z !== HIDDEN_SCALE)) {
          scale.setScalar(HIDDEN_SCALE);
          obj.matrixNeedsUpdate = true;
        }

        // Normally this object being invisible would cause it not to get updated even though the matrixNeedsUpdate flag is set, force it
        if (updateWhileInvisible && obj.matrixNeedsUpdate) {
          obj.updateMatrixWorld(true, true);
        }
      }
      cmp.lastVisible = visible;
    }
  }

  // Called only from camera-tool.tock() to update the matrices
  // of objects and their children whose are updated in tick().
  updateMatrices() {
    for (let i = 0; i < components.length; i++) {
      const cmp = components[i];
      const obj = cmp.el.object3D;
      if (obj.matrixNeedsUpdate) {
        obj.updateMatrixWorld();
      }
    }
  }
}

AFRAME.registerComponent("bone-visibility", {
  schema: {
    updateWhileInvisible: { type: "boolean", default: false }
  },
  play() {
    components.push(this);
  },
  pause() {
    components.splice(components.indexOf(this), 1);
  }
});
