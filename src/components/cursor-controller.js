const TARGET_TYPE_NONE = 1;
const TARGET_TYPE_INTERACTABLE = 2;
const TARGET_TYPE_UI = 4;
const TARGET_TYPE_INTERACTABLE_OR_UI = TARGET_TYPE_INTERACTABLE | TARGET_TYPE_UI;

AFRAME.registerComponent("cursor-controller", {
  dependencies: ["raycaster", "line"],
  schema: {
    cursor: { type: "selector" },
    camera: { type: "selector" },
    maxDistance: { default: 3 },
    minDistance: { default: 0 },
    cursorColorHovered: { default: "#2F80ED" },
    cursorColorUnhovered: { default: "#FFFFFF" }
  },

  init: function() {
    this.enabled = true;
    this.inVR = false;
    this.isMobile = AFRAME.utils.device.isMobile();
    this.currentTargetType = TARGET_TYPE_NONE;
    this.currentDistance = this.data.maxDistance;
    this.currentDistanceMod = 0;
    this.mousePos = new THREE.Vector2();
    this.useMousePos = true;
    this.wasCursorHovered = false;
    this.origin = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.controllerQuaternion = new THREE.Quaternion();

    this.data.cursor.setAttribute("material", { color: this.data.cursorColorUnhovered });

    this.forceCursorUpdate = this.forceCursorUpdate.bind(this);
    this.startInteraction = this.startInteraction.bind(this);
    this.moveCursor = this.moveCursor.bind(this);
    this.endInteraction = this.endInteraction.bind(this);
    this.changeDistanceMod = this.changeDistanceMod.bind(this);

    this._handleCursorLoaded = this._handleCursorLoaded.bind(this);
    this.data.cursor.addEventListener("loaded", this._handleCursorLoaded);
  },

  remove: function() {
    this.data.cursor.removeEventListener("loaded", this._handleCursorLoaded);
  },

  enable: function() {
    this.enabled = true;
  },

  disable: function() {
    this.enabled = false;
    this.setCursorVisibility(false);
  },

  tick: function() {
    if (!this.enabled) {
      return;
    }

    if (this.useMousePos) {
      const camera = this.data.camera.components.camera.camera;
      const raycaster = this.el.components.raycaster.raycaster;
      raycaster.setFromCamera(this.mousePos, camera);
      this.origin.copy(raycaster.ray.origin);
      this.direction.copy(raycaster.ray.direction);
    } else {
      this.rayObject.getWorldPosition(this.origin);
      this.rayObject.getWorldDirection(this.direction);
    }
    this.el.setAttribute("raycaster", { origin: this.origin, direction: this.direction });

    if (this._isGrabbing()) {
      const distance = Math.min(
        this.data.maxDistance,
        Math.max(this.data.minDistance, this.currentDistance - this.currentDistanceMod)
      );
      this.direction.multiplyScalar(distance);
      this.data.cursor.object3D.position.addVectors(this.origin, this.direction);
    } else {
      this.currentDistanceMod = 0;
      let intersection = null;
      const intersections = this.el.components.raycaster.intersections;
      if (intersections.length > 0 && intersections[0].distance <= this.data.maxDistance) {
        intersection = intersections[0];
        this.data.cursor.object3D.position.copy(intersection.point);
        this.currentDistance = intersections[0].distance;
      } else {
        this.currentDistance = this.data.maxDistance;
        this.direction.multiplyScalar(this.currentDistance);
        this.data.cursor.object3D.position.addVectors(this.origin, this.direction);
      }

      if (!intersection) {
        this.currentTargetType = TARGET_TYPE_NONE;
      } else if (intersection.object.el.matches(".interactable, .interactable *")) {
        this.currentTargetType = TARGET_TYPE_INTERACTABLE;
      } else if (intersection.object.el.matches(".ui, .ui *")) {
        this.currentTargetType = TARGET_TYPE_UI;
      }

      const isTarget = this._isTargetOfType(TARGET_TYPE_INTERACTABLE_OR_UI);
      if (isTarget && !this.wasCursorHovered) {
        this.wasCursorHovered = true;
        this.data.cursor.setAttribute("material", { color: this.data.cursorColorHovered });
      } else if (!isTarget && this.wasCursorHovered) {
        this.wasCursorHovered = false;
        this.data.cursor.setAttribute("material", { color: this.data.cursorColorUnhovered });
      }
    }

    if (this.hasPointingDevice) {
      this.el.setAttribute("line", { start: this.origin.clone(), end: this.data.cursor.object3D.position.clone() });
    }
  },

  _isGrabbing() {
    return this.data.cursor.components["super-hands"].state.has("grab-start");
  },

  _isTargetOfType: function(mask) {
    return (this.currentTargetType & mask) === this.currentTargetType;
  },

  setCursorVisibility(visible) {
    this.data.cursor.setAttribute("visible", visible);
    this.el.setAttribute("line", { visible: visible && this.hasPointingDevice });
  },

  forceCursorUpdate: function() {
    // Update the ray and cursor positions
    const raycasterComp = this.el.components.raycaster;
    const raycaster = raycasterComp.raycaster;
    const camera = this.data.camera.components.camera.camera;
    const cursor = this.data.cursor;
    raycaster.setFromCamera(this.mousePos, camera);
    this.el.setAttribute("raycaster", { origin: raycaster.ray.origin, direction: raycaster.ray.direction });
    raycasterComp.checkIntersections();
    const intersections = raycasterComp.intersections;
    if (intersections.length === 0 || intersections[0].distance > this.data.maxDistance) {
      this.currentTargetType = TARGET_TYPE_NONE;
      return;
    }
    const intersection = intersections[0];
    if (intersection.object.el.matches(".interactable, .interactable *")) {
      this.currentTargetType = TARGET_TYPE_INTERACTABLE;
    } else if (intersection.object.el.matches(".ui, .ui *")) {
      this.currentTargetType = TARGET_TYPE_UI;
    }
    cursor.object3D.position.copy(intersection.point);
    // Cursor position must be synced to physics before constraint is created
    cursor.components["static-body"].syncToPhysics();
  },

  startInteraction: function() {
    if (this._isTargetOfType(TARGET_TYPE_INTERACTABLE_OR_UI)) {
      this.data.cursor.emit("cursor-grab", {});
      return true;
    }
    return false;
  },

  moveCursor: function(x, y) {
    this.mousePos.set(x, y);
  },

  endInteraction: function() {
    this.data.cursor.emit("cursor-release", {});
  },

  changeDistanceMod: function(delta) {
    this.currentDistanceMod += delta;
  },

  _handleCursorLoaded: function() {
    this.data.cursor.object3DMap.mesh.renderOrder = window.APP.RENDER_ORDER.CURSOR;
    this.data.cursor.removeEventListener("loaded", this._handleCursorLoaded);
  }
});
