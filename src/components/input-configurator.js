import TouchEventsHandler from "../utils/touch-events-handler.js";
import MouseEventsHandler from "../utils/mouse-events-handler.js";
import GearVRMouseEventsHandler from "../utils/gearvr-mouse-events-handler.js";
import ActionEventHandler from "../utils/action-event-handler.js";

AFRAME.registerComponent("input-configurator", {
  schema: {
    cursorController: { type: "selector" },
    gazeTeleporter: { type: "selector" },
    camera: { type: "selector" },
    playerRig: { type: "selector" },
    leftController: { type: "selector" },
    rightController: { type: "selector" },
    leftControllerRayObject: { type: "string" },
    rightControllerRayObject: { type: "string" },
    gazeCursorRayObject: { type: "string" }
  },

  init() {
    this.inVR = this.el.sceneEl.is("vr-mode");
    this.isMobile = AFRAME.utils.device.isMobile();
    this.eventHandlers = [];
    this.controllerQueue = [];
    this.hasPointingDevice = false;
    this.cursor = this.data.cursorController.components["cursor-controller"];
    this.gazeTeleporter = this.data.gazeTeleporter.components["teleport-controls"];
    this.cameraController = this.data.camera.components["pitch-yaw-rotator"];
    this.playerRig = this.data.playerRig;
    this.handedness = "right";

    this.onEnterVR = this.onEnterVR.bind(this);
    this.onExitVR = this.onExitVR.bind(this);
    this.handleControllerConnected = this.handleControllerConnected.bind(this);
    this.handleControllerDisconnected = this.handleControllerDisconnected.bind(this);

    this.configureInput();
  },

  play() {
    this.el.sceneEl.addEventListener("controllerconnected", this.handleControllerConnected);
    this.el.sceneEl.addEventListener("controllerdisconnected", this.handleControllerDisconnected);
    this.el.sceneEl.addEventListener("enter-vr", this.onEnterVR);
    this.el.sceneEl.addEventListener("exit-vr", this.onExitVR);
  },

  pause() {
    this.el.sceneEl.removeEventListener("controllerconnected", this.handleControllerConnected);
    this.el.sceneEl.removeEventListener("controllerdisconnected", this.handleControllerDisconnected);
    this.el.sceneEl.removeEventListener("enter-vr", this.onEnterVR);
    this.el.sceneEl.removeEventListener("exit-vr", this.onExitVR);
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
    this.actionEventHandler = null;
    if (this.lookOnMobile) {
      this.lookOnMobile.el.removeAttribute("look-on-mobile");
      this.lookOnMobile = null;
    }
    this.cursorRequiresManagement = false;
  },

  addLookOnMobile() {
    const onAdded = e => {
      if (e.detail.name !== "look-on-mobile") return;
      this.lookOnMobile = this.el.sceneEl.components["look-on-mobile"];
    };
    this.el.sceneEl.addEventListener("componentinitialized", onAdded);
    // This adds look-on-mobile to the scene
    this.el.sceneEl.setAttribute("look-on-mobile", "camera", this.data.camera);
  },

  configureInput() {
    this.actionEventHandler = new ActionEventHandler(this.el.sceneEl, this.cursor);
    this.eventHandlers.push(this.actionEventHandler);

    this.cursor.el.setAttribute("cursor-controller", "useMousePos", !this.inVR);

    if (this.inVR) {
      this.cameraController.pause();
      this.cursorRequiresManagement = true;
      this.cursor.el.setAttribute("cursor-controller", "minDistance", 0);
      if (this.isMobile) {
        this.eventHandlers.push(new GearVRMouseEventsHandler(this.cursor, this.gazeTeleporter));
      } else {
        this.eventHandlers.push(new MouseEventsHandler(this.cursor, this.cameraController));
      }
    } else {
      this.cameraController.play();
      if (this.isMobile) {
        this.cursor.setCursorVisibility(false);
        this.eventHandlers.push(new TouchEventsHandler(this.cursor, this.cameraController, this.cursor.el));
        this.addLookOnMobile();
      } else {
        this.eventHandlers.push(new MouseEventsHandler(this.cursor, this.cameraController));
        this.cursor.el.setAttribute("cursor-controller", "minDistance", 0.3);
      }
    }
  },

  tick() {
    if (this.cursorRequiresManagement && this.controller) {
      this.actionEventHandler.manageCursorEnabled();
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
    this.cursor.el.setAttribute("cursor-controller", "drawLine", this.hasPointingDevice);

    this.cursor.setCursorVisibility(true);

    if (this.hasPointingDevice) {
      const controllerData = this.controllerQueue[0];
      const hand = controllerData.handedness;
      this.controller = controllerData.controller;
      this.cursor.el.setAttribute("cursor-controller", {
        rayObject: hand === "left" ? this.data.leftControllerRayObject : this.data.rightControllerRayObject
      });
    } else {
      this.controller = null;
      this.cursor.el.setAttribute("cursor-controller", { rayObject: this.data.gazeCursorRayObject });
    }

    if (this.actionEventHandler) {
      this.actionEventHandler.setHandThatAlsoDrivesCursor(this.controller);
    }
  }
});
