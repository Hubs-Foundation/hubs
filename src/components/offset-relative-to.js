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
    selfDestruct: {
      default: false
    }
  },
  init() {
    this.updateOffset = this.updateOffset.bind(this);
    if (this.data.on) {
      this.el.sceneEl.addEventListener(this.data.on, this.updateOffset);
    } else {
      this.updateOffset();
    }
  },

  updateOffset: (function() {
    const offsetVector = new THREE.Vector3();
    return function() {
      const obj = this.el.object3D;
      const target = this.data.target.object3D;
      offsetVector.copy(this.data.offset);
      target.localToWorld(offsetVector);
      if (obj.parent) {
        obj.parent.worldToLocal(offsetVector);
      }
      obj.position.copy(offsetVector);
      // TODO: Hack here to deal with the fact that the rotation component mutates ordering, and we network rotation without sending ordering information
      // See https://github.com/networked-aframe/networked-aframe/issues/134
      obj.rotation.order = "YXZ";
      target.getWorldQuaternion(obj.quaternion);
      if (this.data.selfDestruct) {
        if (this.data.on) {
          this.el.sceneEl.removeEventListener(this.data.on, this.updateOffset);
        }
        this.el.removeAttribute("offset-relative-to");
      }
    };
  })()
});
