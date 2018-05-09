const TARGET_TYPE_NONE = 1;
const TARGET_TYPE_INTERACTABLE = 2;
const TARGET_TYPE_UI = 4;
const TARGET_TYPE_INTERACTABLE_OR_UI = TARGET_TYPE_INTERACTABLE | TARGET_TYPE_UI;

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
    minDistance: { default: 0.5 },
    cursorColorHovered: { default: "#2F80ED" },
    cursorColorUnhovered: { default: "#FFFFFF" },
    primaryDown: { default: "action_primary_down" },
    primaryUp: { default: "action_primary_up" },
    grabEvent: { default: "action_grab" },
    releaseEvent: { default: "action_release" }
  },

  init: function() {
    this.inVR = false;
    this.isMobile = AFRAME.utils.device.isMobile();
    this.hasPointingDevice = false;
    this.currentTargetType = TARGET_TYPE_NONE;
    this.grabStarting = false;
    this.currentDistance = this.data.maxDistance;
    this.currentDistanceMod = 0;
    this.mousePos = new THREE.Vector2();
    this.controller = null;
    this.controllerQueue = [];
    this.wasCursorHovered = false;
    this.wasPhysicalHandGrabbing = false;
    this.origin = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.controllerQuaternion = new THREE.Quaternion();

    this.data.cursor.setAttribute("material", { color: this.data.cursorColorUnhovered });

    const functionNames = [
      "_handleTouchStart",
      "_handleTouchMove",
      "_handleTouchEnd",
      "_handleMouseDown",
      "_handleMouseMove",
      "_handleMouseUp",
      "_handleWheel",
      "_handleEnterVR",
      "_handleExitVR",
      "_handlePrimaryDown",
      "_handlePrimaryUp",
      "_handleModelLoaded",
      "_handleCursorLoaded",
      "_handleControllerConnected",
      "_handleControllerDisconnected"
    ];
    functionNames.forEach(name => {
      this[name] = this[name].bind(this);
    });

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
    document.addEventListener("touchstart", this._handleTouchStart);
    document.addEventListener("touchmove", this._handleTouchMove);
    document.addEventListener("touchend", this._handleTouchEnd);
    document.addEventListener("touchcancel", this._handleTouchEnd);
    document.addEventListener("mousedown", this._handleMouseDown);
    document.addEventListener("mousemove", this._handleMouseMove);
    document.addEventListener("mouseup", this._handleMouseUp);
    document.addEventListener("wheel", this._handleWheel);

    window.addEventListener("enter-vr", this._handleEnterVR);
    window.addEventListener("exit-vr", this._handleExitVR);

    this.data.playerRig.addEventListener(this.data.primaryDown, this._handlePrimaryDown);
    this.data.playerRig.addEventListener(this.data.primaryUp, this._handlePrimaryUp);
    this.data.playerRig.addEventListener(this.data.grabEvent, this._handlePrimaryDown);
    this.data.playerRig.addEventListener(this.data.releaseEvent, this._handlePrimaryUp);
    this.data.playerRig.addEventListener("model-loaded", this._handleModelLoaded);

    this.el.sceneEl.addEventListener("controllerconnected", this._handleControllerConnected);
    this.el.sceneEl.addEventListener("controllerdisconnected", this._handleControllerDisconnected);
  },

  pause: function() {
    document.removeEventListener("touchstart", this._handleTouchStart);
    document.removeEventListener("touchmove", this._handleTouchMove);
    document.removeEventListener("touchend", this._handleTouchEnd);
    document.removeEventListener("touchcancel", this._handleTouchEnd);
    document.removeEventListener("mousedown", this._handleMouseDown);
    document.removeEventListener("mousemove", this._handleMouseMove);
    document.removeEventListener("mouseup", this._handleMouseUp);
    document.removeEventListener("wheel", this._handleWheel);

    window.removeEventListener("enter-vr", this._handleEnterVR);
    window.removeEventListener("exit-vr", this._handleExitVR);

    this.data.playerRig.removeEventListener(this.data.primaryDown, this._handlePrimaryDown);
    this.data.playerRig.removeEventListener(this.data.primaryUp, this._handlePrimaryUp);
    this.data.playerRig.removeEventListener(this.data.grabEvent, this._handlePrimaryDown);
    this.data.playerRig.removeEventListener(this.data.releaseEvent, this._handlePrimaryUp);
    this.data.playerRig.removeEventListener("model-loaded", this._handleModelLoaded);

    this.el.sceneEl.removeEventListener("controllerconnected", this._handleControllerConnected);
    this.el.sceneEl.removeEventListener("controllerdisconnected", this._handleControllerDisconnected);
  },

  tick: function() {
    //handle physical hand
    if (this.physicalHand) {
      const state = this.physicalHand.components["super-hands"].state;
      const isPhysicalHandGrabbing = state.has("grab-start") || state.has("hover-start");
      if (this.wasPhysicalHandGrabbing != isPhysicalHandGrabbing) {
        this._setCursorVisibility(!isPhysicalHandGrabbing);
        this.currentTargetType = TARGET_TYPE_NONE;
      }
      this.wasPhysicalHandGrabbing = isPhysicalHandGrabbing;
      if (isPhysicalHandGrabbing) return;
    }

    //set raycaster origin/direction
    const camera = this.data.camera.components.camera.camera;
    if (!this.inVR) {
      //mouse cursor mode
      const raycaster = this.el.components.raycaster.raycaster;
      raycaster.setFromCamera(this.mousePos, camera);
      this.origin.copy(raycaster.ray.origin);
      this.direction.copy(raycaster.ray.direction);
    } else if ((this.inVR || this.isMobile) && !this.hasPointingDevice) {
      //gaze cursor mode
      camera.getWorldPosition(this.origin);
      camera.getWorldDirection(this.direction);
    } else if (this.controller != null) {
      //3d cursor mode
      this.controller.object3D.getWorldPosition(this.origin);
      this.controller.object3D.getWorldQuaternion(this.controllerQuaternion);
      this.direction
        .set(0, 0, -1)
        .applyQuaternion(this.controllerQuaternion)
        .normalize();
    }

    this.el.setAttribute("raycaster", { origin: this.origin, direction: this.direction });

    let intersection = null;

    //update cursor position
    if (!this._isGrabbing()) {
      const intersections = this.el.components.raycaster.intersections;
      if (intersections.length > 0 && intersections[0].distance <= this.data.maxDistance) {
        intersection = intersections[0];
        this.data.cursor.object3D.position.copy(intersection.point);
        this.currentDistance = intersections[0].distance;
      } else {
        this.currentDistance = this.data.maxDistance;
      }
      this.currentDistanceMod = 0;
    }

    if (this._isGrabbing() || !intersection) {
      const max = Math.max(this.data.minDistance, this.currentDistance - this.currentDistanceMod);
      const distance = Math.min(max, this.data.maxDistance);
      this.currentDistanceMod = this.currentDistance - distance;
      this.direction.multiplyScalar(distance);
      this.data.cursor.object3D.position.addVectors(this.origin, this.direction);
    }

    //update currentTargetType
    if (this._isGrabbing() && !intersection) {
      this.currentTargetType = TARGET_TYPE_INTERACTABLE;
    } else if (intersection) {
      if (intersection.object.el.matches(".interactable, .interactable *")) {
        this.currentTargetType = TARGET_TYPE_INTERACTABLE;
      } else if (intersection.object.el.matches(".ui, .ui *")) {
        this.currentTargetType = TARGET_TYPE_UI;
      }
    } else {
      this.currentTargetType = TARGET_TYPE_NONE;
    }

    //update cursor material
    const isTarget = this._isTargetOfType(TARGET_TYPE_INTERACTABLE_OR_UI);
    if ((this._isGrabbing() || isTarget) && !this.wasCursorHovered) {
      this.wasCursorHovered = true;
      this.data.cursor.setAttribute("material", { color: this.data.cursorColorHovered });
    } else if (!this._isGrabbing() && !isTarget && this.wasCursorHovered) {
      this.wasCursorHovered = false;
      this.data.cursor.setAttribute("material", { color: this.data.cursorColorUnhovered });
    }

    //update line
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

  _setCursorVisibility(visible) {
    this.data.cursor.setAttribute("visible", visible);
    this.el.setAttribute("line", { visible: visible && this.hasPointingDevice });
  },

  _setLookControlsEnabled(enabled) {
    const lookControls = this.data.camera.components["look-controls"];
    if (lookControls) {
      if (enabled) {
        lookControls.play();
      } else {
        lookControls.pause();
      }
    }
  },

  _startTeleport: function() {
    if (this.controller != null) {
      this.controller.emit("cursor-teleport_down", {});
    } else if (this.inVR) {
      this.data.gazeTeleportControls.emit("cursor-teleport_down", {});
    }
    this._setCursorVisibility(false);
  },

  _endTeleport: function() {
    if (this.controller != null) {
      this.controller.emit("cursor-teleport_up", {});
    } else if (this.inVR) {
      this.data.gazeTeleportControls.emit("cursor-teleport_up", {});
    }
    this._setCursorVisibility(true);
  },

  _handleTouchStart: function(e) {
    if (!this.isMobile || this.hasPointingDevice || this.activeTouch) return;

    for (let i = e.touches.length - 1; i >= 0; i--) {
      const touch = e.touches[i];
      if (touch.clientY / window.innerHeight < 0.8) {
        this.activeTouch = touch;
        break;
      }
    }
    if (!this.activeTouch) return;

    // Update the ray and cursor positions
    const raycasterComp = this.el.components.raycaster;
    const raycaster = raycasterComp.raycaster;
    const camera = this.data.camera.components.camera.camera;
    const cursor = this.data.cursor;
    this.mousePos.set(
      this.activeTouch.clientX / window.innerWidth * 2 - 1,
      -(this.activeTouch.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(this.mousePos, camera);
    this.el.setAttribute("raycaster", { origin: raycaster.ray.origin, direction: raycaster.ray.direction });
    raycasterComp.checkIntersections();
    const intersections = raycasterComp.intersections;
    if (intersections.length === 0 || intersections[0].distance >= this.data.maxDistance) {
      this.activeTouch = null;
      return;
    }
    cursor.object3D.position.copy(intersections[0].point);
    // Cursor position must be synced to physics before constraint is created
    cursor.components["static-body"].syncToPhysics();
    cursor.emit("cursor-grab", {});
  },

  _handleTouchMove: function(e) {
    if (!this.isMobile || this.hasPointingDevice) return;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (
        (!this.activeTouch && touch.clientY / window.innerHeight < 0.8) ||
        touch.identifier === this.activeTouch.identifier
      ) {
        this.mousePos.set(touch.clientX / window.innerWidth * 2 - 1, -(touch.clientY / window.innerHeight) * 2 + 1);
        return;
      }
    }
  },

  _handleTouchEnd: function(e) {
    if (
      !this.isMobile ||
      this.hasPointingDevice ||
      !this.activeTouch ||
      e.touches.some(touch => touch.identifier === this.activeTouch.identifier)
    ) {
      return;
    }

    this.data.cursor.emit("cursor-release", {});
    this.activeTouch = null;
  },

  _handleMouseDown: function() {
    if (this.isMobile && !this.inVR && !this.hasPointingDevice) return;

    if (this._isTargetOfType(TARGET_TYPE_INTERACTABLE_OR_UI)) {
      this._setLookControlsEnabled(false);
      this.data.cursor.emit("cursor-grab", {});
    } else if (this.inVR || this.isMobile) {
      this._startTeleport();
    }
  },

  _handleMouseMove: function(e) {
    if (this.isMobile && !this.inVR && !this.hasPointingDevice) return;

    this.mousePos.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  },

  _handleMouseUp: function() {
    if (this.isMobile && !this.inVR && !this.hasPointingDevice) return;

    this._setLookControlsEnabled(true);
    this.data.cursor.emit("cursor-release", {});
    this._endTeleport();
  },

  _handleWheel: function(e) {
    if (this._isGrabbing()) {
      switch (e.deltaMode) {
        case e.DOM_DELTA_PIXEL:
          this.currentDistanceMod += e.deltaY / 500;
          break;
        case e.DOM_DELTA_LINE:
          this.currentDistanceMod += e.deltaY / 10;
          break;
        case e.DOM_DELTA_PAGE:
          this.currentDistanceMod += e.deltaY / 2;
          break;
      }
    }
  },

  _handleEnterVR: function() {
    if (AFRAME.utils.device.checkHeadsetConnected()) {
      this.inVR = true;
      this._updateController();
    }
  },

  _handleExitVR: function() {
    this.inVR = false;
    this._updateController();
  },

  _handlePrimaryDown: function(e) {
    if (e.target === this.controller) {
      const isInteractable = this._isTargetOfType(TARGET_TYPE_INTERACTABLE) && !this.grabStarting;
      if (isInteractable || this._isTargetOfType(TARGET_TYPE_UI)) {
        this.grabStarting = true;
        this.data.cursor.emit("cursor-grab", e.detail);
      } else if (e.type !== this.data.grabEvent) {
        this._startTeleport();
      }
    }
  },

  _handlePrimaryUp: function(e) {
    if (e.target === this.controller) {
      this.grabStarting = false;
      if (this._isGrabbing() || this._isTargetOfType(TARGET_TYPE_UI)) {
        this.data.cursor.emit("cursor-release", e.detail);
      } else if (e.type !== this.data.releaseEvent) {
        this._endTeleport();
      }
    }
  },

  _handleModelLoaded: function() {
    this.physicalHand = this.data.playerRig.querySelector(this.data.physicalHandSelector);
  },

  _handleCursorLoaded: function() {
    this.data.cursor.object3DMap.mesh.renderOrder = window.RENDER_ORDER.CURSOR;
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

    this._setCursorVisibility(this.hasPointingDevice);

    if (this.hasPointingDevice) {
      const controllerData = this.controllerQueue[0];
      const hand = controllerData.handedness;
      this.el.setAttribute("cursor-controller", { physicalHandSelector: `#player-${hand}-controller` });
      this.controller = controllerData.controller;
    } else {
      this.controller = null;
    }
  }
});
