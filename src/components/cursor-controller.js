const TARGET_TYPE_NONE = 1;
const TARGET_TYPE_INTERACTABLE = 2;
const TARGET_TYPE_UI = 4;
const TARGET_TYPE_INTERACTABLE_OR_UI = TARGET_TYPE_INTERACTABLE | TARGET_TYPE_UI;

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
    near: { default: 0 },
    cursorColorHovered: { default: "#2F80ED" },
    cursorColorUnhovered: { default: "#FFFFFF" },
    rayObject: { type: "selector" },
    drawLine: { default: false },
    objects: { default: "" }
  },

  init: function() {
    this.enabled = true;
    this.currentTargetType = TARGET_TYPE_NONE;
    this.currentDistance = this.data.far;
    this.currentDistanceMod = 0;
    this.mousePos = new THREE.Vector2();
    this.wasCursorHovered = false;
    this.data.cursor.setAttribute("material", { color: this.data.cursorColorUnhovered });

    this._handleCursorLoaded = this._handleCursorLoaded.bind(this);
    this.data.cursor.addEventListener("loaded", this._handleCursorLoaded);

    // raycaster state
    this.targets = [];
    this.intersection = null;
    this.raycaster = new THREE.Raycaster();
    this.setDirty = this.setDirty.bind(this);
    this.dirty = true;
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

  performRaycast: (function() {
    const rayObjectRotation = new THREE.Quaternion();
    const rawIntersections = [];
    return function performRaycast(targets) {
      if (this.data.rayObject) {
        const rayObject = this.data.rayObject.object3D;
        rayObject.updateMatrixWorld();
        rayObjectRotation.setFromRotationMatrix(rayObject.matrixWorld);
        this.raycaster.ray.origin.setFromMatrixPosition(rayObject.matrixWorld);
        this.raycaster.ray.direction.set(0, 0, -1).applyQuaternion(rayObjectRotation);
      } else {
        this.raycaster.setFromCamera(this.mousePos, this.data.camera.components.camera.camera); // camera
      }
      const prevIntersection = this.intersection;
      rawIntersections.length = 0;
      this.raycaster.intersectObjects(targets, true, rawIntersections);
      this.intersection = rawIntersections.find(x => x.object.el);
      this.emitIntersectionEvents(prevIntersection, this.intersection);
    };
  })(),

  enable: function() {
    this.enabled = true;
  },

  disable: function() {
    this.enabled = false;
    this.setCursorVisibility(false);
  },

  tick: (() => {
    const cameraPos = new THREE.Vector3();

    return function() {
      if (!this.enabled) {
        return;
      }

      if (this.dirty) {
        this.populateEntities(this.data.objects, this.targets);
        this.dirty = false;
      }

      this.performRaycast(this.targets);

      if (this.isInteracting()) {
        const distance = Math.min(
          this.data.far,
          Math.max(this.data.near, this.currentDistance - this.currentDistanceMod)
        );
        this.data.cursor.object3D.position.copy(this.raycaster.ray.origin);
        this.data.cursor.object3D.position.addScaledVector(this.raycaster.ray.direction, distance);
      } else {
        this.currentDistanceMod = 0;
        this.updateDistanceAndTargetType();

        const isTarget = this._isTargetOfType(TARGET_TYPE_INTERACTABLE_OR_UI);
        if (isTarget && !this.wasCursorHovered) {
          this.wasCursorHovered = true;
          this.data.cursor.setAttribute("material", { color: this.data.cursorColorHovered });
        } else if (!isTarget && this.wasCursorHovered) {
          this.wasCursorHovered = false;
          this.data.cursor.setAttribute("material", { color: this.data.cursorColorUnhovered });
        }
      }

      if (this.data.drawLine) {
        this.el.setAttribute("line", {
          start: this.raycaster.ray.origin.clone(),
          end: this.data.cursor.object3D.position.clone()
        });
      }

      // The cursor will always be oriented towards the player about its Y axis, so objects held by the cursor will rotate towards the player.
      this.data.camera.object3D.getWorldPosition(cameraPos);
      cameraPos.y = this.data.cursor.object3D.position.y;
      this.data.cursor.object3D.lookAt(cameraPos);
    };
  })(),

  updateDistanceAndTargetType: function() {
    const intersection = this.intersection;
    if (intersection && intersection.distance <= this.data.far) {
      this.data.cursor.object3D.position.copy(intersection.point);
      this.currentDistance = intersection.distance;
    } else {
      this.currentDistance = this.data.far;
      this.data.cursor.object3D.position.copy(this.raycaster.ray.origin);
      this.data.cursor.object3D.position.addScaledVector(this.raycaster.ray.direction, this.currentDistance);
    }

    if (!intersection) {
      this.currentTargetType = TARGET_TYPE_NONE;
    } else if (intersection.object.el.matches(".interactable, .interactable *")) {
      this.currentTargetType = TARGET_TYPE_INTERACTABLE;
    } else if (intersection.object.el.matches(".ui, .ui *")) {
      this.currentTargetType = TARGET_TYPE_UI;
    }
  },

  _isTargetOfType: function(mask) {
    return (this.currentTargetType & mask) === this.currentTargetType;
  },

  setCursorVisibility: function(visible) {
    this.data.cursor.setAttribute("visible", visible);
    this.el.setAttribute("line", { visible: visible && this.data.drawLine });
  },

  forceCursorUpdate: function() {
    this.performRaycast(this.targets);
    this.updateDistanceAndTargetType();
    this.data.cursor.components["static-body"].syncToPhysics();
  },

  isInteracting: function() {
    return this.data.cursor.components["super-hands"].state.has("grab-start");
  },

  startInteraction: function() {
    if (this._isTargetOfType(TARGET_TYPE_INTERACTABLE_OR_UI)) {
      this.data.cursor.emit("cursor-grab", {});
      return true;
    }
    return false;
  },

  endInteraction: function() {
    this.data.cursor.emit("cursor-release", {});
  },

  moveCursor: function(x, y) {
    this.mousePos.set(x, y);
  },

  changeDistanceMod: function(delta) {
    const { near, far } = this.data;
    const targetDistanceMod = this.currentDistanceMod + delta;
    const moddedDistance = this.currentDistance - targetDistanceMod;
    if (moddedDistance > far || moddedDistance < near) {
      this.el.emit("cursor-distance-change-blocked");
      return false;
    }

    this.currentDistanceMod = targetDistanceMod;
    this.el.emit("cursor-distance-changed");
    return true;
  },

  _handleCursorLoaded: function() {
    this.data.cursor.object3DMap.mesh.renderOrder = window.APP.RENDER_ORDER.CURSOR;
    this.data.cursor.removeEventListener("loaded", this._handleCursorLoaded);
  },

  remove: function() {
    this.emitIntersectionEvents(this.intersection, null);
    this.intersection = null;
    this.data.cursor.removeEventListener("loaded", this._handleCursorLoaded);
  }
});
