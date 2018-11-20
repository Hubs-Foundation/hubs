import { paths } from "../systems/userinput/paths";
import { getLastWorldPosition } from "../utils/three-utils";

/**
 * Manages targeting and physical cursor location. Has the following responsibilities:
 *
 * - Tracking which entities in the scene can be targeted by the cursor (`objects`).
 * - Performing a raycast per-frame or on-demand to identify which entity is being currently targeted.
 * - Updating the visual presentation and position of the `cursor` entity and `line` component per frame.
 * - Sending an event when an entity is targeted or un-targeted.
 */
AFRAME.registerComponent("cursor-controller", {
  dependencies: ["line"],
  schema: {
    cursor: { type: "selector" },
    camera: { type: "selector" },
    far: { default: 3 },
    near: { default: 0.06 },
    cursorColorHovered: { default: "#2F80ED" },
    cursorColorUnhovered: { default: "#FFFFFF" },
    rayObject: { type: "selector" },
    objects: { default: "" }
  },

  init: function() {
    this.enabled = true;

    this.data.cursor.addEventListener(
      "loaded",
      () => {
        this.data.cursor.object3DMap.mesh.renderOrder = window.APP.RENDER_ORDER.CURSOR;
      },
      { once: true }
    );

    // raycaster state
    this.setDirty = this.setDirty.bind(this);
    this.targets = [];
    this.raycaster = new THREE.Raycaster();
    this.dirty = true;
    this.distance = this.data.far;
  },

  update: function() {
    this.raycaster.far = this.data.far;
    this.raycaster.near = this.data.near;
    this.setDirty();
  },

  play: function() {
    this.observer = new MutationObserver(this.setDirty);
    this.observer.observe(this.el.sceneEl, { childList: true, attributes: true, subtree: true });
    this.el.sceneEl.addEventListener("object3dset", this.setDirty);
    this.el.sceneEl.addEventListener("object3dremove", this.setDirty);
  },

  pause: function() {
    this.observer.disconnect();
    this.el.sceneEl.removeEventListener("object3dset", this.setDirty);
    this.el.sceneEl.removeEventListener("object3dremove", this.setDirty);
  },

  setDirty: function() {
    this.dirty = true;
  },

  populateEntities: function(selector, target) {
    target.length = 0;
    const els = this.data.objects ? this.el.sceneEl.querySelectorAll(this.data.objects) : this.el.sceneEl.children;
    for (let i = 0; i < els.length; i++) {
      if (els[i].object3D) {
        target.push(els[i].object3D);
      }
    }
  },

  emitIntersectionEvents: function(prevIntersection, currIntersection) {
    // if we are now intersecting something, and previously we were intersecting nothing or something else
    if (currIntersection && (!prevIntersection || currIntersection.object.el !== prevIntersection.object.el)) {
      this.data.cursor.emit("raycaster-intersection", { el: currIntersection.object.el });
    }
    // if we were intersecting something, but now we are intersecting nothing or something else
    if (prevIntersection && (!currIntersection || currIntersection.object.el !== prevIntersection.object.el)) {
      this.data.cursor.emit("raycaster-intersection-cleared", { el: prevIntersection.object.el });
    }
  },

  tick: (() => {
    const rawIntersections = [];
    const cameraPos = new THREE.Vector3();
    return function() {
      if (this.dirty) {
        // app aware devices cares about this.targets so we must update it even if cursor is not enabled
        this.populateEntities(this.data.objects, this.targets);
        this.dirty = false;
      }

      const userinput = AFRAME.scenes[0].systems.userinput;
      const cursorPose = userinput.get(paths.actions.cursor.pose);
      const rightHandPose = userinput.get(paths.actions.rightHand.pose);

      this.data.cursor.object3D.visible = this.enabled && !!cursorPose;
      const lineVisible = !!(this.enabled && rightHandPose);

      if (this.el.getAttribute("line").visible !== lineVisible) {
        this.el.setAttribute("line", "visible", lineVisible);
      }

      if (!this.enabled || !cursorPose) {
        return;
      }

      let intersection;
      const isGrabbing = this.data.cursor.components["super-hands"].state.has("grab-start");
      if (!isGrabbing) {
        rawIntersections.length = 0;
        this.raycaster.ray.origin = cursorPose.position;
        this.raycaster.ray.direction = cursorPose.direction;
        this.raycaster.intersectObjects(this.targets, true, rawIntersections);
        intersection = rawIntersections.find(x => x.object.el);
        this.emitIntersectionEvents(this.prevIntersection, intersection);
        this.prevIntersection = intersection;
        this.distance = intersection ? intersection.distance : this.data.far;
      }

      const { cursor, near, far, camera, cursorColorHovered, cursorColorUnhovered } = this.data;

      const cursorModDelta = userinput.get(paths.actions.cursor.modDelta);
      if (isGrabbing && cursorModDelta) {
        this.distance = THREE.Math.clamp(this.distance - cursorModDelta, near, far);
      }
      cursor.object3D.position.copy(cursorPose.position).addScaledVector(cursorPose.direction, this.distance);
      // The cursor will always be oriented towards the player about its Y axis, so objects held by the cursor will rotate towards the player.
      getLastWorldPosition(camera.object3D, cameraPos);
      cameraPos.y = cursor.object3D.position.y;
      cursor.object3D.lookAt(cameraPos);
      cursor.object3D.matrixNeedsUpdate = true;

      const cursorColor = intersection || isGrabbing ? cursorColorHovered : cursorColorUnhovered;

      if (this.data.cursor.getAttribute("material").color !== cursorColor) {
        this.data.cursor.setAttribute("material", "color", cursorColor);
      }

      if (this.el.components.line.data.visible) {
        this.el.setAttribute("line", {
          start: cursorPose.position.clone(),
          end: cursor.object3D.position.clone()
        });
      }
    };
  })(),

  remove: function() {
    this.emitIntersectionEvents(this.prevIntersection, null);
    delete this.prevIntersection;
  }
});
