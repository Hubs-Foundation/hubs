import { waitForDOMContentLoaded } from "../utils/async-utils";

/**
 * Positions an entity relative to a given target when the given event is fired.
 * @component offset-relative-to
 */
AFRAME.registerComponent("offset-relative-to", {
  schema: {
    target: {
      type: "selector"
    },
    offset: {
      type: "vec3"
    },
    on: {
      type: "string"
    },
    orientation: {
      default: 1 // see doc/image_orientations.gif
    },
    selfDestruct: {
      default: false
    },
    lookAt: {
      default: false
    }
  },
  init() {
    this.updateOffset = this.updateOffset.bind(this);

    waitForDOMContentLoaded().then(() => {
      if (this.data.on) {
        this.el.sceneEl.addEventListener(this.data.on, this.updateOffset);
      } else {
        this.updateOffset();
      }
    });
  },

  updateOffset: (function() {
    const y = new THREE.Vector3(0, 1, 0);
    const z = new THREE.Vector3(0, 0, -1);
    const QUARTER_CIRCLE = Math.PI / 2;
    const offsetVector = new THREE.Vector3();
    const targetWorldPos = new THREE.Vector3();
    return function() {
      const obj = this.el.object3D;
      const target = this.data.target.object3D;
      offsetVector.copy(this.data.offset);
      target.localToWorld(offsetVector);
      if (obj.parent) {
        obj.parent.worldToLocal(offsetVector);
      }
      obj.position.copy(offsetVector);
      if (this.data.lookAt) {
        target.getWorldPosition(targetWorldPos);
        obj.updateMatrices(true);
        obj.lookAt(targetWorldPos);
      } else {
        target.getWorldQuaternion(obj.quaternion);
      }

      // See doc/image_orientations.gif
      switch (this.data.orientation) {
        case 8:
          obj.rotateOnAxis(z, 3 * QUARTER_CIRCLE);
          break;
        case 7:
          obj.rotateOnAxis(z, 3 * QUARTER_CIRCLE);
          obj.rotateOnAxis(y, 2 * QUARTER_CIRCLE);
          break;
        case 6:
          obj.rotateOnAxis(z, QUARTER_CIRCLE);
          break;
        case 5:
          obj.rotateOnAxis(z, QUARTER_CIRCLE);
          obj.rotateOnAxis(y, 2 * QUARTER_CIRCLE);
          break;
        case 4:
          obj.rotateOnAxis(z, 2 * QUARTER_CIRCLE);
          obj.rotateOnAxis(y, 2 * QUARTER_CIRCLE);
          break;
        case 3:
          obj.rotateOnAxis(z, 2 * QUARTER_CIRCLE);
          break;
        case 2:
          obj.rotateOnAxis(y, 2 * QUARTER_CIRCLE);
          break;
        case 1:
        default:
          break;
      }

      obj.matrixNeedsUpdate = true;

      if (this.data.selfDestruct) {
        if (this.data.on) {
          this.el.sceneEl.removeEventListener(this.data.on, this.updateOffset);
        }
        this.el.removeAttribute("offset-relative-to");
      }
    };
  })()
});
