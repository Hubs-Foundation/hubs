import TouchEventsHandler from "../utils/touch-events-handler.js";
import MouseEventsHandler from "../utils/mouse-events-handler.js";
import GearVRMouseEventsHandler from "../utils/gearvr-mouse-events-handler.js";
import PrimaryActionHandler from "../utils/primary-action-handler.js";

AFRAME.registerComponent("input-configurator", {
  init() {
    this.inVR = this.el.sceneEl.is("vr-mode");
    this.isMobile = AFRAME.utils.device.isMobile();
    this.eventHandlers = [];
    this.controller = null;
    this.controllerQueue = [];
    this.hasPointingDevice = false;
    this.cursor = document.querySelector("#cursor-controller").components["cursor-controller"];
    this.gazeTeleporter = document.querySelector("#gaze-teleport").components["teleport-controls"];
    this.cameraController = document.querySelector("#player-camera").components["camera-controller"];
    this.playerRig = document.querySelector("#player-rig");
    this.handedness = "right";

    this.onEnterVR = this.onEnterVR.bind(this);
    this.onExitVR = this.onExitVR.bind(this);
    this.tearDown = this.tearDown.bind(this);
    this.configureInput = this.configureInput.bind(this);
    this.addLookOnMobile = this.addLookOnMobile.bind(this);
    this.handleControllerConnected = this.handleControllerConnected.bind(this);
    this.handleControllerDisconnected = this.handleControllerDisconnected.bind(this);

    this.el.sceneEl.addEventListener("enter-vr", this.onEnterVR);
    this.el.sceneEl.addEventListener("exit-vr", this.onExitVR);

    this.tearDown();
    this.configureInput();
  },

  play() {
    this.el.sceneEl.addEventListener("controllerconnected", this.handleControllerConnected);
    this.el.sceneEl.addEventListener("controllerdisconnected", this.handleControllerDisconnected);
  },

  pause() {
    this.el.sceneEl.removeEventListener("controllerconnected", this.handleControllerConnected);
    this.el.sceneEl.removeEventListener("controllerdisconnected", this.handleControllerDisconnected);
  },

  onEnterVR() {
    this.inVR = true;
    this.tearDown();
    this.configureInput();
    this.updateController();
  },

  onExitVR() {
    this.inVR = false;
    this.tearDown();
    this.configureInput();
    this.updateController();
  },

  tearDown() {
    this.eventHandlers.forEach(h => h.tearDown());
    this.eventHandlers = [];
    this.primaryActionHandler = null;
    if (this.lookOnMobile) {
      this.lookOnMobile.el.removeComponent("look-on-mobile");
      this.lookOnMobile = null;
    }
    this.cameraController.pause();
    this.cursorRequiresManagement = false;
  },

  addLookOnMobile() {
    const onAdded = e => {
      if (e.detail.name !== "look-on-mobile") return;
      this.lookOnMobile = this.el.sceneEl.components["look-on-mobile"];
      this.lookOnMobile.registerCameraController(this.cameraController);
    };
    this.el.sceneEl.addEventListener("componentinitialized", onAdded);
    this.el.sceneEl.setAttribute("look-on-mobile", "");
  },

  configureInput() {
    if (this.inVR) {
      this.cursor.useMousePos = false;
      this.cursorRequiresManagement = true;
      this.hovered = false;
      this.primaryActionHandler = new PrimaryActionHandler(this.el.sceneEl, this.cursor);
      this.eventHandlers.push(this.primaryActionHandler);
      if (this.isMobile) {
        this.eventHandlers.push(new GearVRMouseEventHandler(this.cursor, this.gazeTeleporter));
      }
    } else {
      this.cameraController.play();
      this.cursor.useMousePos = true;
      if (this.isMobile) {
        this.eventHandlers.push(new TouchEventsHandler(this.cursor, this.cameraController, this.cursor.el));
        this.addLookOnMobile();
      } else {
        this.eventHandlers.push(new MouseEventsHandler(this.cursor, this.cameraController));
      }
    }
  },

  tick() {
    if (!this.cursorRequiresManagement) return;

    if (this.physicalHand) {
      const state = this.physicalHand.components["super-hands"].state;
      if (!this.hovered && state.has("hover-start") && !this.primaryActionHandler.isCursorInteracting) {
        this.cursor.disable();
        this.hovered = true;
      } else if (this.hovered === true && !state.has("hover-start") && !state.has("grab-start")) {
        this.cursor.enable();
        this.cursor.setCursorVisibility(!this.primaryActionHandler.isTeleporting);
        this.hovered = false;
      }
    }
  },

  handleControllerConnected: function(e) {
    const data = {
      controller: e.target,
      handedness: e.detail.component.data.hand
    };

    if (data.handedness === this.handedness) {
      this.controllerQueue.unshift(data);
    } else {
      this.controllerQueue.push(data);
    }

    this.updateController();
  },

  handleControllerDisconnected: function(e) {
    for (let i = 0; i < this.controllerQueue.length; i++) {
      if (e.target === this.controllerQueue[i].controller) {
        this.controllerQueue.splice(i, 1);
        this.updateController();
        return;
      }
    }
  },

  updateController: function() {
    this.hasPointingDevice = this.controllerQueue.length > 0 && this.inVR;

    this.cursor.setCursorVisibility(this.hasPointingDevice || this.isMobile || (!this.isMobile && !this.inVR));

    if (this.hasPointingDevice) {
      const controllerData = this.controllerQueue[0];
      const hand = controllerData.handedness;
      this.controller = controllerData.controller;
      this.physicalHand = this.playerRig.querySelector(`#player-${hand}-controller`);
      this.cursor.rayObject = this.controller.querySelector(`#player-${hand}-controller-reverse-z`).object3D;
    } else {
      this.controller = null;
    }

    if (this.primaryActionHandler) {
      this.primaryActionHandler.setCursorController(this.controller);
    }
  }
});
