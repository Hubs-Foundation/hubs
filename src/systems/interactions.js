import { sets } from "./userinput/sets";
import { paths } from "./userinput/paths";

const THREEJS_OBJECT_DESCENDENTS = {
  uuidToEl: new Map(),
  rootToDescendents: new Map(),
  descendentsToRoot: new Map(),
  associate: function(el, descendentUuids) {
    this.uuidToEl.set(el.object3D.uuid, el);
    this.rootToDescendents.set(el.object3D.uuid, descendentUuids);
    for (let uuid of descendentUuids) {
      this.descendentsToRoot.set(uuid, el.object3D.uuid);
    }
  }
};

AFRAME.registerComponent("threejs-object-descendents-aggregator", {
  init: function() {
    this.addDescendents = this.addDescendents.bind(this);

    this.descendents = new Set();
    this.addDescendents();
  },

  addDescendents: function() {
    this.el.object3D.traverse(o => {
      if (!this.descendents.has(o.uuid)) {
        this.descendents.add(o.uuid);
        o.el.addEventListener("object3dset", this.addDescendents);
      }
    });
    THREEJS_OBJECT_DESCENDENTS.associate(this.el, this.descendents);
  }
});

AFRAME.registerComponent("offers-remote-constraint", {});
AFRAME.registerComponent("is-ui", {});

AFRAME.registerSystem("interaction", {
  init: function() {
    this.rightRemoteHoverTarget = null;
    this.rightRemoteConstraintTarget = null;
  },
  updateCursorIntersections: function(raw) {
    if (!raw[0]) {
      this.rightRemoteHoverTarget = null;
      return;
    }
    const rootUuid = THREEJS_OBJECT_DESCENDENTS.descendentsToRoot.get(raw[0].object.uuid);
    if (!rootUuid) {
      this.rightRemoteHoverTarget = null;
      return;
    }
    this.rightRemoteHoverTarget = THREEJS_OBJECT_DESCENDENTS.uuidToEl.get(rootUuid);
  },

  tick: (function() {
    return function() {
      const userinput = AFRAME.scenes[0].systems.userinput;
      if (this.rightRemoteConstraintTarget) {
        if (userinput.get(paths.actions.cursor.drop)) {
          this.rightRemoteConstraintTarget = null;
        }
      } else {
        if (this.rightRemoteHoverTarget && this.rightRemoteHoverTarget.components["offers-remote-constraint"]) {
          const grab = userinput.get(paths.actions.cursor.grab);
          if (grab) {
            this.rightRemoteConstraintTarget = this.rightRemoteHoverTarget;
          }
        }
      }

      if (this.rightRemoteConstraintTarget) {
        this.cursor = this.cursor || document.querySelector("#cursor").object3D;
        const o = this.rightRemoteConstraintTarget.object3D;
        this.cursor.updateMatrices();
        o.updateMatrices();
        o.matrix.getInverse(o.parent.matrixWorld).multiply(this.cursor.matrixWorld);
        o.matrixWorldNeedsUpdate = true;
      }
    };
  })()
});
