const TARGET_TYPE_NONE = 1;
const TARGET_TYPE_INTERACTABLE = 2;
const TARGET_TYPE_UI = 4;
const TARGET_TYPE_OTHER = 8;
const TARGET_TYPE_INTERACTABLE_OR_UI = TARGET_TYPE_INTERACTABLE | TARGET_TYPE_UI;

AFRAME.registerComponent("cursor-controller", {
  dependencies: ["raycaster", "line"],
  schema: {
    cursor: { type: "selector" },
    camera: { type: "selector" },
    controller: { type: "selector" },
    playerRig: { type: "selector" },
    otherHand: { type: "string" },
    hand: { default: "right" },
    trackedControls: { type: "selectorAll", default: "[tracked-controls]" },
    maxDistance: { default: 3 },
    minDistance: { default: 0.5 },
    cursorColorHovered: { default: "#FF0000" },
    cursorColorUnhovered: { default: "#FFFFFF" },
    controllerEvent: { type: "string", default: "action_primary_down" },
    controllerEndEvent: { type: "string", default: "action_primary_up" },
    teleportEvent: { type: "string", default: "action_teleport_down" },
    teleportEndEvent: { type: "string", default: "action_teleport_up" }
  },

  init: function() {
    this.inVR = false;
    this.isMobile = AFRAME.utils.device.isMobile();
    this.trackedControls = [];
    this.hasPointingDevice = false;
    this.currentTargetType = TARGET_TYPE_NONE;
    this.isGrabbing = false;
    this.wasOtherHandGrabbing = false;
    this.wasIntersecting = false;
    this.currentDistance = this.data.maxDistance;
    this.currentDistanceMod = 0;
    this.origin = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.point = new THREE.Vector3();
    this.mousePos = new THREE.Vector2();
    this.controllerQuaternion = new THREE.Quaternion();

    this.data.cursor.setAttribute("material", { color: this.data.cursorColorUnhovered });

    this.mouseDownListener = this._handleMouseDown.bind(this);
    this.mouseMoveListener = this._handleMouseMove.bind(this);
    this.mouseUpListener = this._handleMouseUp.bind(this);
    this.wheelListener = this._handleWheel.bind(this);

    this.enterVRListener = this._handleEnterVR.bind(this);
    this.exitVRListener = this._handleExitVR.bind(this);

    this.raycasterIntersectionListener = this._handleRaycasterIntersection.bind(this);
    this.raycasterIntersectionClearedListener = this._handleRaycasterIntersectionCleared.bind(this);

    this.controllerEventListener = this._handleControllerEvent.bind(this);
    this.controllerEndEventListener = this._handleControllerEndEvent.bind(this);

    this.modelLoadedListener = this._handleModelLoaded.bind(this);
  },

  update: function(oldData) {
    if (this.data.controller !== oldData.controller) {
      if (oldData.controller) {
        oldData.controller.removeEventListener(this.data.controllerEvent, this.controllerEventListener);
        oldData.controller.removeEventListener(this.data.controllerEndEvent, this.controllerEndEventListener);
      }

      this.data.controller.addEventListener(this.data.controllerEvent, this.controllerEventListener);
      this.data.controller.addEventListener(this.data.controllerEndEvent, this.controllerEndEventListener);
    }

    if (oldData.otherHand && this.data.otherHand !== oldData.otherHand) {
      this._handleModelLoaded();
    }
  },

  play: function() {
    document.addEventListener("mousedown", this.mouseDownListener);
    document.addEventListener("mousemove", this.mouseMoveListener);
    document.addEventListener("mouseup", this.mouseUpListener);
    document.addEventListener("wheel", this.wheelListener);

    window.addEventListener("enter-vr", this.enterVRListener);
    window.addEventListener("exit-vr", this.exitVRListener);

    this.el.addEventListener("raycaster-intersection", this.raycasterIntersectionListener);
    this.el.addEventListener("raycaster-intersection-cleared", this.raycasterIntersectionClearedListener);

    this.data.playerRig.addEventListener("model-loaded", this.modelLoadedListener);

    //TODO: separate this into its own component? Or find an existing component that does this better.
    this.checkForPointingDeviceInterval = setInterval(() => {
      const controller = this._getController();
      if (this.hasPointingDevice != !!controller) {
        this.el.setAttribute("line", { visible: !!controller && !this._isLineAlwaysHidden });
      }
      this.hasPointingDevice = !!controller;
      if (controller && this.data.hand != controller.hand) {
        this.el.setAttribute("cursor-controller", {
          hand: controller.hand,
          controller: `#player-${controller.hand}-controller`,
          otherHand: `#${controller.hand}-super-hand`
        });
      }
    }, 1000);
  },

  pause: function() {
    document.removeEventListener("mousedown", this.mouseDownListener);
    document.removeEventListener("mousemove", this.mouseMoveListener);
    document.removeEventListener("mouseup", this.mouseUpListener);
    document.removeEventListener("wheel", this.wheelListener);

    window.removeEventListener("enter-vr", this.enterVRListener);
    window.removeEventListener("exit-vr", this.exitVRListener);

    this.el.removeEventListener("raycaster-intersection", this.raycasterIntersectionListener);
    this.el.removeEventListener("raycaster-intersection-cleared", this.raycasterIntersectionClearedListener);

    this.data.controller.removeEventListener(this.data.controllerEvent, this.controllerEventListener);
    this.data.controller.removeEventListener(this.data.controllerEndEvent, this.controllerEndEventListener);

    this.data.playerRig.removeEventListener("model-loaded", this.modelLoadedListener);

    clearInterval(this.checkForPointingDeviceInterval);
  },

  tick: function() {
    this.isGrabbing = this.data.cursor.components["super-hands"].state.has("grab-start");

    if (this.otherHand) {
      const state = this.otherHand.components["super-hands"].state;
      const isOtherHandGrabbing = state.has("grab-start") || state.has("hover-start");
      if (this.wasOtherHandGrabbing != isOtherHandGrabbing) {
        this.data.cursor.setAttribute("visible", !isOtherHandGrabbing && !this._isLineAlwaysHidden);
      }
      this.wasOtherHandGrabbing = isOtherHandGrabbing;
    }

    if (this.wasOtherHandGrabbing) return;

    const camera = this.data.camera.components.camera.camera;
    if (!this.inVR && !this.isMobile) {
      //mouse
      const raycaster = this.el.components.raycaster.raycaster;
      raycaster.setFromCamera(this.mousePos, camera);
      this.origin = raycaster.ray.origin;
      this.direction = raycaster.ray.direction;
    } else if ((this.inVR || this.isMobile) && !this.hasPointingDevice) {
      //gaze
      camera.getWorldPosition(this.origin);
      camera.getWorldDirection(this.direction);
    } else {
      //3d
      this.data.controller.object3D.getWorldPosition(this.origin);
      this.data.controller.object3D.getWorldQuaternion(this.controllerQuaternion);
      this.direction
        .set(0, 0, -1)
        .applyQuaternion(this.controllerQuaternion)
        .normalize();
    }

    this.el.setAttribute("raycaster", { origin: this.origin, direction: this.direction });

    let intersection = null;

    if (!this.isGrabbing) {
      const intersections = this.el.components.raycaster.intersections;
      if (intersections.length > 0 && intersections[0].distance <= this.data.maxDistance) {
        intersection = intersections[0];
        this.data.cursor.object3D.position.copy(intersection.point);
        this.currentDistance = intersections[0].distance;
        this.currentDistanceMod = 0;
      } else {
        this.currentDistance = this.data.maxDistance;
      }
    }

    if (this.isGrabbing || !intersection) {
      const distance = Math.min(
        Math.max(this.data.minDistance, this.currentDistance - this.currentDistanceMod),
        this.data.maxDistance
      );
      this.currentDistanceMod = this.currentDistance - distance;
      this.direction.multiplyScalar(distance);
      this.point.addVectors(this.origin, this.direction);
      this.data.cursor.object3D.position.copy(this.point);
    }

    if (intersection) {
      if (this._isInteractableAllowed() && this._isClass("interactable", intersection.object.el)) {
        this.currentTargetType = TARGET_TYPE_INTERACTABLE;
      } else if (this._isClass("ui", intersection.object.el)) {
        this.currentTargetType = TARGET_TYPE_UI;
      }
    } else {
      this.currentTargetType = TARGET_TYPE_NONE;
    }

    const isTarget = this._isTargetOfType(TARGET_TYPE_INTERACTABLE_OR_UI);
    if ((this.isGrabbing || isTarget) && !this.wasIntersecting) {
      this.wasIntersecting = true;
      this.data.cursor.setAttribute("material", { color: this.data.cursorColorHovered });
    } else if (!this.isGrabbing && !isTarget && this.wasIntersecting) {
      this.wasIntersecting = false;
      this.data.cursor.setAttribute("material", { color: this.data.cursorColorUnhovered });
    }

    if (this.hasPointingDevice) {
      this.el.setAttribute("line", { start: this.origin.clone(), end: this.data.cursor.object3D.position.clone() });
    }
  },

  _isClass: function(className, el) {
    return (
      el.className === className ||
      (el.parentNode && el.parentNode != el.sceneEl && this._isClass(className, el.parentNode))
    );
  },

  _isInteractableAllowed: function() {
    return !(this.inVR && this.hasPointingDevice) || this.isMobile;
  },

  _isTargetOfType: function(mask) {
    return (this.currentTargetType & mask) === this.currentTargetType;
  },

  _isLineAlwaysHidden: function() {
    return !this.inVR && !this.isMobile;
  },

  _getController: function() {
    //TODO: prefer initial hand set in data.hand
    for (let i = this.data.trackedControls.length - 1; i >= 0; i--) {
      const trackedControlsComponent = this.data.trackedControls[i].components["tracked-controls"];
      if (trackedControlsComponent && trackedControlsComponent.controller) {
        return trackedControlsComponent.controller;
      }
    }
    return null;
  },

  _startTeleport: function() {
    this.data.controller.emit(this.data.teleportEvent, {});
    this.el.setAttribute("line", { visible: false });
    this.data.cursor.setAttribute("visible", false);
  },

  _endTeleport: function() {
    this.data.controller.emit(this.data.teleportEndEvent, {});
    this.el.setAttribute("line", { visible: !this._isLineAlwaysHidden });
    this.data.cursor.setAttribute("visible", true);
  },

  _handleMouseDown: function() {
    if (this._isTargetOfType(TARGET_TYPE_INTERACTABLE)) {
      const lookControls = this.data.camera.components["look-controls"];
      if (lookControls) lookControls.pause();
      this.data.cursor.emit(this.data.controllerEvent, {});
    } else if (this.inVR && this.hasPointingDevice) {
      this._startTeleport();
    }
  },

  _handleMouseMove: function(e) {
    this.mousePos.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  },

  _handleMouseUp: function() {
    const lookControls = this.data.camera.components["look-controls"];
    if (lookControls) lookControls.play();
    this.data.cursor.emit(this.data.controllerEndEvent, {});
    if (this.inVR && this.hasPointingDevice) {
      this._endTeleport();
    }
  },

  _handleWheel: function(e) {
    if (this.isGrabbing) {
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
    }
  },

  _handleExitVR: function() {
    this.inVR = false;
  },

  _handleRaycasterIntersection: function(e) {
    this.data.cursor.emit("raycaster-intersection", e.detail);
  },

  _handleRaycasterIntersectionCleared: function(e) {
    this.data.cursor.emit("raycaster-intersection-cleared", e.detail);
  },

  _handleControllerEvent: function(e) {
    switch (this.currentTargetType) {
      case TARGET_TYPE_INTERACTABLE:
        if (!this._isInteractableAllowed()) {
          break;
        }
      case TARGET_TYPE_UI:
        this.data.cursor.emit(this.data.controllerEvent, e.detail);
        break;
      default:
        this._startTeleport();
        break;
    }
  },

  _handleControllerEndEvent: function(e) {
    if (this.isGrabbing || this._isTargetOfType(TARGET_TYPE_UI)) {
      this.data.cursor.emit(this.data.controllerEndEvent, e.detail);
    } else {
      this._endTeleport();
    }
  },

  _handleModelLoaded: function() {
    this.otherHand = this.data.playerRig.querySelector(this.data.otherHand);
  }
});
