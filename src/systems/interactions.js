// Goal : Collect all of the threejs objects that we might care about hovering onto.
//        Notice when we hover on or off them.

import { sets } from "./userinput/sets";

const AGGREGATE_AND_MARK_THREEJS_OBJECTS_FOR_INTERACTION = "aggregate-and-mark-objects";
AFRAME.registerComponent(AGGREGATE_AND_MARK_THREEJS_OBJECTS_FOR_INTERACTION, {
  schema: {
    offerConstraintWhenHovered: { type: "boolean" }
  },

  init: function() {
    this.onObjectAdded = this.onObjectAdded.bind(this);
    this.kids = new Set();
    this.el.object3D.traverse(o => {
      this.kids.add(o.uuid);
      o.addEventListener("added", this.onObjectAdded);
      o.el.addEventListener("object3dset", this.onObjectAdded);
    });

    if (!AFRAME.scenes[0].systems.interaction) {
      console.warn("no interaction system yet. setting timeout because yolo.");
      window.setTimeout(() => {
        AFRAME.scenes[0].systems.interaction.register(this.el.object3D.uuid, this.kids);
      }, 3000);
    } else {
      AFRAME.scenes[0].systems.interaction.register(this.el.object3D.uuid, this.kids);
    }
  },

  onObjectAdded: function() {
    this.el.object3D.traverse(o => {
      if (!this.kids.has(o.uuid)) {
        this.kids.add(o.uuid);
        o.addEventListener("added", this.onObjectAdded);
        o.el.addEventListener("object3dset", this.onObjectAdded);
      }
    });
    AFRAME.scenes[0].systems.interaction.register(this.el.object3D.uuid, this.kids);
  }
});

AFRAME.registerSystem("interaction", {
  init() {
    this.rootToKids = new Map();
    this.kidsToRoot = new Map();
  },
  register(root, kids) {
    this.rootToKids.set(root, kids);
    for (let kid of kids.keys()) {
      this.kidsToRoot.set(kid, root);
    }
  },

  updateCursorIntersections: function(raw) {
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (!raw[0]) {
      userinput.toggleSet(sets.cursorHoveringOnInteractable, false);
      userinput.toggleSet(sets.cursorHoveringOnNothing, true);
      this.currentlyHoveredRoot = null;
      return;
    }
    const root = this.kidsToRoot.get(raw[0].object.uuid);
    if (!root) {
      userinput.toggleSet(sets.cursorHoveringOnInteractable, false);
      userinput.toggleSet(sets.cursorHoveringOnNothing, true);
      this.currentlyHoveredRoot = null;
      return;
    }
    userinput.toggleSet(sets.cursorHoveringOnInteractable, true);
    userinput.toggleSet(sets.cursorHoveringOnNothing, false);
    this.currentlyHoveredRoot = root;
  }
});
