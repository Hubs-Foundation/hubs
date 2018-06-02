const TARGET_TYPE_NONE = 1;
const TARGET_TYPE_INTERACTABLE = 2;
const TARGET_TYPE_UI = 4;
const TARGET_TYPE_INTERACTABLE_OR_UI = TARGET_TYPE_INTERACTABLE | TARGET_TYPE_UI;

/**
 * Controls virtual cursor behavior in various modalities to affect teleportation, interatables and UI.
 * @namespace user-input
 * @component cursor-controller
 */
AFRAME.registerComponent("cursor-controller", {
  dependencies: ["raycaster", "line"],
  schema: {
    cursor: { type: "selector" },
    camera: { type: "selector" },
    playerRig: { type: "selector" },
    gazeTeleportControls: { type: "selector" },
    physicalHandSelector: { type: "string" },
    handedness: { default: "right", oneOf: ["right", "left"] },
    maxDistance: { default: 3 },
    minDistance: { default: 0 },
    cursorColorHovered: { default: "#2F80ED" },
    cursorColorUnhovered: { default: "#FFFFFF" }
  },

  init: function() {
    this.enabled = true;
    this.inVR = false;
    this.isMobile = AFRAME.utils.device.isMobile();
    this.hasPointingDevice = false;
    this.currentTargetType = TARGET_TYPE_NONE;
    this.currentDistance = this.data.maxDistance;
    this.currentDistanceMod = 0;
    this.mousePos = new THREE.Vector2();
    this.useMousePos = true;
    this.controller = null;
    this.controllerQueue = [];
    this.wasCursorHovered = false;
    this.wasPhysicalHandGrabbing = false;
    this.origin = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.controllerQuaternion = new THREE.Quaternion();

    this.data.cursor.setAttribute("material", { color: this.data.cursorColorUnhovered });

    this.forceCursorUpdate = this.forceCursorUpdate.bind(this);
    this.startInteraction = this.startInteraction.bind(this);
    this.moveCursor = this.moveCursor.bind(this);
    this.endInteraction = this.endInteraction.bind(this);
    this.changeDistanceMod = this.changeDistanceMod.bind(this);

    this._handleEnterVR = this._handleEnterVR.bind(this);
    this._handleExitVR = this._handleExitVR.bind(this);
    this._handleModelLoaded = this._handleModelLoaded.bind(this);
    this._handleCursorLoaded = this._handleCursorLoaded.bind(this);
    this._handleControllerConnected = this._handleControllerConnected.bind(this);
    this._handleControllerDisconnected = this._handleControllerDisconnected.bind(this);

    this.data.cursor.addEventListener("loaded", this._handleCursorLoaded);
  },

  remove: function() {
    this.data.cursor.removeEventListener("loaded", this._handleCursorLoaded);
  },

  update: function(oldData) {
    if (oldData.physicalHandSelector !== this.data.physicalHandSelector) {
      this._handleModelLoaded();
    }

    if (oldData.handedness !== this.data.handedness) {
      //TODO
    }
  },

  play: function() {
    window.addEventListener("enter-vr", this._handleEnterVR);
    window.addEventListener("exit-vr", this._handleExitVR);

    this.data.playerRig.addEventListener("model-loaded", this._handleModelLoaded);

    this.el.sceneEl.addEventListener("controllerconnected", this._handleControllerConnected);
    this.el.sceneEl.addEventListener("controllerdisconnected", this._handleControllerDisconnected);
  },

  pause: function() {
    window.removeEventListener("enter-vr", this._handleEnterVR);
    window.removeEventListener("exit-vr", this._handleExitVR);

    this.data.playerRig.removeEventListener("model-loaded", this._handleModelLoaded);

    this.el.sceneEl.removeEventListener("controllerconnected", this._handleControllerConnected);
    this.el.sceneEl.removeEventListener("controllerdisconnected", this._handleControllerDisconnected);
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

  _handleEnterVR: function() {
    this.inVR = true;
    this._updateController();
  },

  _handleExitVR: function() {
    this.inVR = false;
    this._updateController();
  },

  _handleModelLoaded: function() {
    this.physicalHand = this.data.playerRig.querySelector(this.data.physicalHandSelector);
  },

  _handleCursorLoaded: function() {
    this.data.cursor.object3DMap.mesh.renderOrder = window.APP.RENDER_ORDER.CURSOR;
  },

  _handleControllerConnected: function(e) {
    const data = {
      controller: e.target,
      handedness: e.detail.component.data.hand
    };

    if (data.handedness === this.data.handedness) {
      this.controllerQueue.unshift(data);
    } else {
      this.controllerQueue.push(data);
    }

    this._updateController();
  },

  _handleControllerDisconnected: function(e) {
    for (let i = 0; i < this.controllerQueue.length; i++) {
      if (e.target === this.controllerQueue[i].controller) {
        this.controllerQueue.splice(i, 1);
        this._updateController();
        return;
      }
    }
  },

  _updateController: function() {
    this.hasPointingDevice = this.controllerQueue.length > 0 && this.inVR;

    this.setCursorVisibility(this.hasPointingDevice || this.isMobile || (!this.isMobile && !this.inVR));

    if (this.hasPointingDevice) {
      const controllerData = this.controllerQueue[0];
      const hand = controllerData.handedness;
      this.el.setAttribute("cursor-controller", { physicalHandSelector: `#player-${hand}-controller` });
      this.controller = controllerData.controller;
      this.rayObject = controllerData.controller.querySelector(`#player-${hand}-controller-reverse-z`).object3D;
      this.useMousePos = false;
    } else {
      this.controller = null;
      if (this.inVR) {
        const camera = this.data.camera.components.camera.camera;
        this.rayObject = camera;
        this.useMousePos = false;
      } else {
        this.useMousePos = true;
      }
    }
  }
});
