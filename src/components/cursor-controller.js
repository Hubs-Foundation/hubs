import { paths } from "../systems/actions/paths";
import { sets } from "../systems/actions/sets";
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
    this.currentDistanceMod = 0;
    this.mousePos = new THREE.Vector2();
    this.data.cursor.setAttribute("material", { color: this.data.cursorColorUnhovered });

    this._handleCursorLoaded = this._handleCursorLoaded.bind(this);
    this.data.cursor.addEventListener("loaded", this._handleCursorLoaded);

    // raycaster state
    this.targets = [];
    this.intersection = null;
    this.raycaster = new THREE.Raycaster();
    this.setDirty = this.setDirty.bind(this);
    this.dirty = true;
    this.distance = this.data.far;

    this.actionSystemCallback = this.actionSystemCallback.bind(this);
  },

  actionSystemCallback: (function() {
    const rawIntersections = [];
    return function actionSystemCallback(frame) {
      const superhandsIsGrabbing = this.data.cursor.components["super-hands"].state.has("grab-start");
      const cursorPose = frame[paths.app.cursorPose];
      if (!this.enabled || superhandsIsGrabbing || !cursorPose) {
        return;
      }

      if (this.dirty) {
        this.populateEntities(this.data.objects, this.targets);
        this.dirty = false;
      }
      rawIntersections.length = 0;
      this.raycaster.ray.origin = cursorPose.position;
      this.raycaster.ray.direction = cursorPose.direction;
      this.raycaster.intersectObjects(this.targets, true, rawIntersections);
      const intersection = rawIntersections.find(x => x.object.el);
      this.intersection = intersection;
      const isHoveringOnPen = intersection && intersection.object.el.matches(".pen, .pen *");
      const isHoveringOnVideo = intersection && intersection.object.el.matches(".video, .video *");
      const isHoveringOnInteractable = intersection && intersection.object.el.matches(".interactable, .interactable *");
      const actions = AFRAME.scenes[0].systems.actions;
      actions[isHoveringOnPen ? "activate" : "deactivate"](sets.cursorHoveringOnPen);
      actions[isHoveringOnVideo ? "activate" : "deactivate"](sets.cursorHoveringOnVideo);
      actions[isHoveringOnInteractable ? "activate" : "deactivate"](sets.cursorHoveringOnInteractable);
    };
  })(),

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
      this.data.cursor.setAttribute("material", { color: this.data.cursorColorHovered });
    }
    // if we were intersecting something, but now we are intersecting nothing or something else
    if (prevIntersection && (!currIntersection || currIntersection.object.el !== prevIntersection.object.el)) {
      this.data.cursor.emit("raycaster-intersection-cleared", { el: prevIntersection.object.el });
      this.data.cursor.setAttribute("material", { color: this.data.cursorColorUnhovered });
    }
  },

  performRaycast: (function() {
    const rayObjectRotation = new THREE.Quaternion();
    const rawIntersections = [];
    return function performRaycast(targets) {
      const actions = AFRAME.scenes[0].systems.actions;
      const cursorPose = actions.poll(paths.app.cursorPose);
      if (cursorPose) {
        this.raycaster.ray.origin = cursorPose.position;
        this.raycaster.ray.direction = cursorPose.direction;
      } else if (this.data.rayObject) {
        const rayObject = this.data.rayObject.object3D;
        rayObject.updateMatrixWorld();
        rayObjectRotation.setFromRotationMatrix(rayObject.matrixWorld);
        this.raycaster.ray.origin.setFromMatrixPosition(rayObject.matrixWorld);
        this.raycaster.ray.direction.set(0, 0, -1).applyQuaternion(rayObjectRotation);
      } else {
        this.raycaster.setFromCamera(this.mousePos, this.data.camera.components.camera.camera); // camera
      }
      rawIntersections.length = 0;
      this.raycaster.intersectObjects(targets, true, rawIntersections);
      return rawIntersections.find(x => x.object.el);
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

      const intersection = this.intersection;
      this.emitIntersectionEvents(this.prevIntersection, intersection);
      this.prevIntersection = intersection;
      if (intersection) {
        this.distance = intersection.distance;
      } else {
        this.distance = this.data.far;
      }

      const actions = AFRAME.scenes[0].systems.actions;
      const cursorPose = actions.poll(paths.app.cursorPose);
      this.setCursorVisibility(!!cursorPose);
      if (!cursorPose) {
        return;
      }

      const { cursor, near, far, drawLine, camera } = this.data;
      const cursorPosition = cursor.object3D.position;
      const isGrabbing = cursor.components["super-hands"].state.has("grab-start");
      if (isGrabbing) {
        const cursorModDelta = actions.poll(paths.app.cursorModDelta);
        if (cursorModDelta) {
          this.changeDistanceMod(cursorModDelta);
        }
        cursorPosition
          .copy(cursorPose.position)
          .addScaledVector(cursorPose.direction, THREE.Math.clamp(this.distance - this.currentDistanceMod, near, far));
      } else {
        this.currentDistanceMod = 0;
        if (intersection) {
          cursorPosition.copy(intersection.point);
        } else {
          cursorPosition.copy(cursorPose.position).addScaledVector(cursorPose.direction, far);
        }
      }

      if (drawLine) {
        this.el.setAttribute("line", {
          start: cursorPose.position.clone(),
          end: cursor.object3D.position.clone()
        });
      }

      // The cursor will always be oriented towards the player about its Y axis, so objects held by the cursor will rotate towards the player.
      camera.object3D.getWorldPosition(cameraPos);
      cameraPos.y = cursor.object3D.position.y;
      cursor.object3D.lookAt(cameraPos);

      if (isGrabbing) {
        if (actions.poll(paths.app.cursorDrop)) {
          this.endInteraction();
        }
      } else {
        if (actions.poll(paths.app.cursorGrab)) {
          this.startInteraction();
        }
      }
    };
  })(),

  updateDistanceAndTargetType: function() {},

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
    return;
  },

  startInteraction: function() {
    const actions = AFRAME.scenes[0].systems.actions;
    actions.activate(sets.cursorHoldingInteractable);
    this.data.cursor.emit("cursor-grab", {});
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
    const moddedDistance = this.distance - targetDistanceMod;
    if (moddedDistance > far || moddedDistance < near) {
      return false;
    }

    this.currentDistanceMod = targetDistanceMod;
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
