// Goal : Collect all of the threejs objects that we might care about hovering onto.
//        Notice when we hover on or off them.

import { sets } from "./userinput/sets";
import { paths } from "./userinput/paths";

const AGGREGATE_AND_MARK_THREEJS_OBJECTS_FOR_INTERACTION = "aggregate-and-mark-objects";
AFRAME.registerComponent(AGGREGATE_AND_MARK_THREEJS_OBJECTS_FOR_INTERACTION, {
  schema: {
    offerConstraintWhenHovered: { type: "boolean", default: false },
    isPen: { type: "boolean", default: false },
    isCamera: { type: "boolean", default: false },
    isUI: { type: "boolean", default: false }
  },

  init: function() {
    this.onObjectAdded = this.onObjectAdded.bind(this);
    this.kids = new Set();
    this.el.object3D.traverse(o => {
      this.kids.add(o.uuid);
      o.addEventListener("added", this.onObjectAdded);
      o.el.addEventListener("object3dset", this.onObjectAdded);
    });

    AFRAME.scenes[0].systems.interaction.register(this.el.object3D.uuid, this.kids, this.data);
  },

  onObjectAdded: function() {
    this.el.object3D.traverse(o => {
      if (!this.kids.has(o.uuid)) {
        this.kids.add(o.uuid);
        o.addEventListener("added", this.onObjectAdded);
        o.el.addEventListener("object3dset", this.onObjectAdded);
      }
    });
    AFRAME.scenes[0].systems.interaction.register(this.el.object3D, this.kids, this.data);
  }
});

AFRAME.registerSystem("interaction", {
  init() {
    this.rootToKids = new Map();
    this.kidsToRoot = new Map();
    this.rootToData = new Map();
    this.uuidToObject3D = new Map();
  },
  register(root, kids, data) {
    this.uuidToObject3D.set(root.uuid, root);
    this.rootToKids.set(root.uuid, kids);
    this.rootToData.set(root.uuid, data);
    for (let kid of kids.keys()) {
      this.kidsToRoot.set(kid, root.uuid);
    }
  },

  updateCursorIntersections: function(raw) {
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (!raw[0]) {
      this.currentlyHoveredRoot = null;
      return;
    }
    const root = this.kidsToRoot.get(raw[0].object.uuid);
    if (!root) {
      this.currentlyHoveredRoot = null;
      return;
    }
    this.currentlyHoveredRoot = root;
  },

  tick: (function() {
    const m = new THREE.Matrix4();
    return function() {
      const userinput = AFRAME.scenes[0].systems.userinput;
      if (!this.currentlyConstrainedRoot) {
        if (!!this.currentlyHoveredRoot && this.rootToData.get(this.currentlyHoveredRoot).offerConstraintWhenHovered) {
          const grab = userinput.get(paths.actions.cursor.grab);
          if (grab) {
            this.currentlyConstrainedRoot = this.currentlyHoveredRoot;
          }
        }
      } else {
        const drop = userinput.get(paths.actions.cursor.drop);
        if (drop) {
          this.currentlyConstrainedRoot = null;
        }
      }

      if (!!this.currentlyConstrainedRoot) {
        const b = document.querySelector("#cursor").object3D;
        const a = this.uuidToObject3D.get(this.currentlyConstrainedRoot);
        const m = new THREE.Matrix4();
        b.matrixIsModified = true;
        b.updateMatrices();
        a.matrixIsModified = true;
        a.updateMatrices();
        m.getInverse(a.matrixWorld).multiply(b.matrixWorld);
        a.matrix.copy(m);
        a.matrixWorldNeedsUpdate = true;
        a.childrenNeedMatrixWorldUpdate = true;
        a.updateMatrices();
      }
    };
  })()
});

AFRAME.registerComponent("test-track", {
  tick: function() {
    const b = document.querySelector("#cursor").object3D;
    const a = this.el.object3D;
    const m = new THREE.Matrix4();
    b.matrixIsModified = true;
    b.updateMatrices();
    a.matrixIsModified = true;
    a.updateMatrices();
    m.getInverse(a.parent.matrixWorld).multiply(b.matrixWorld);
    a.matrix.copy(m);
//    a.matrix.decompose(a.position, a.quaternion, a.scale);
    a.matrixWorldNeedsUpdate = true;
    a.updateMatrixWorld();
    this.foo = this.foo || 0;
    this.foo += 1;
    if (this.foo % 100 === 0) {
      let s = "";
      for (let i = 0; i < 16; i++) {
        s += "" + a.matrixWorld.elements[i] + " " + b.matrixWorld.elements[i] + "\n";
      }
      console.log(s);
    }
  }
});
