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
    cursorColorUnhovered: { default: "#FFFFFF" },
    rayObject: { type: "selector" },
    useMousePos: { default: true },
    drawLine: { default: false }
  },

  init: function() {
    this.enabled = true;
    this.inVR = false;
    this.isMobile = AFRAME.utils.device.isMobile();
    this.currentTargetType = TARGET_TYPE_NONE;
    this.currentDistance = this.data.maxDistance;
    this.currentDistanceMod = 0;
    this.mousePos = new THREE.Vector2();
    this.wasCursorHovered = false;
    this.origin = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.raycasterAttr = this.el.getAttribute("raycaster");
    this.controllerQuaternion = new THREE.Quaternion();
    this.data.cursor.setAttribute("material", { color: this.data.cursorColorUnhovered });

    this._handleCursorLoaded = this._handleCursorLoaded.bind(this);
    this.data.cursor.addEventListener("loaded", this._handleCursorLoaded);
  },

  enable: function() {
    this.enabled = true;
  },

  disable: function() {
    this.enabled = false;
    this.setCursorVisibility(false);
  },

  updateRay: function() {
    this.raycasterAttr.origin = this.origin;
    this.raycasterAttr.direction = this.direction;
    this.el.setAttribute("raycaster", this.raycasterAttr, true);
  },

  tick: (() => {
    const rayObjectRotation = new THREE.Quaternion();
    const cameraPos = new THREE.Vector3();

    return function() {
      if (!this.enabled) {
        return;
      }

      if (this.data.useMousePos) {
        this.setRaycasterWithMousePos();
      } else {
        const rayObject = this.data.rayObject.object3D;
        rayObjectRotation.setFromRotationMatrix(rayObject.matrixWorld);
        this.direction
          .set(0, 0, -1)
          .applyQuaternion(rayObjectRotation)
          .normalize();
        this.origin.setFromMatrixPosition(rayObject.matrixWorld);
        this.updateRay();
      }

      const isGrabbing = this.data.cursor.components["super-hands"].state.has("grab-start");
      if (isGrabbing) {
        const distance = Math.min(
          this.data.maxDistance,
          Math.max(this.data.minDistance, this.currentDistance - this.currentDistanceMod)
        );
        this.direction.multiplyScalar(distance);
        this.data.cursor.object3D.position.addVectors(this.origin, this.direction);
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
        this.el.setAttribute("line", { start: this.origin.clone(), end: this.data.cursor.object3D.position.clone() });
      }

      // The cursor will always be oriented towards the player about its Y axis, so objects held by the cursor will rotate towards the player.
      this.data.camera.object3D.getWorldPosition(cameraPos);
      cameraPos.y = this.data.cursor.object3D.position.y;
      this.data.cursor.object3D.lookAt(cameraPos);
    };
  })(),

  setRaycasterWithMousePos: function() {
    const camera = this.data.camera.components.camera.camera;
    const raycaster = this.el.components.raycaster.raycaster;
    raycaster.setFromCamera(this.mousePos, camera);
    this.origin.copy(raycaster.ray.origin);
    this.direction.copy(raycaster.ray.direction);
    this.updateRay();
  },

  updateDistanceAndTargetType: function() {
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
  },

  _isTargetOfType: function(mask) {
    return (this.currentTargetType & mask) === this.currentTargetType;
  },

  setCursorVisibility: function(visible) {
    this.data.cursor.setAttribute("visible", visible);
    this.el.setAttribute("line", { visible: visible && this.data.drawLine });
  },

  forceCursorUpdate: function() {
    this.setRaycasterWithMousePos();
    this.el.components.raycaster.checkIntersections();
    this.updateDistanceAndTargetType();
    this.data.cursor.components["static-body"].syncToPhysics();
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
    const { minDistance, maxDistance } = this.data;
    const targetDistanceMod = this.currentDistanceMod + delta;
    const moddedDistance = this.currentDistance - targetDistanceMod;
    if (moddedDistance > maxDistance || moddedDistance < minDistance) {
      return;
    }
    this.currentDistanceMod = targetDistanceMod;
  },

  _handleCursorLoaded: function() {
    this.data.cursor.object3DMap.mesh.renderOrder = window.APP.RENDER_ORDER.CURSOR;
    this.data.cursor.removeEventListener("loaded", this._handleCursorLoaded);
  },

  remove: function() {
    this.data.cursor.removeEventListener("loaded", this._handleCursorLoaded);
  }
});
