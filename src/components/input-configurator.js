import TouchEventsHandler from "../utils/touch-events-handler.js";
import MouseEventsHandler from "../utils/mouse-events-handler.js";
import GearVRMouseEventsHandler from "../utils/gearvr-mouse-events-handler.js";
import PrimaryActionHandler from "../utils/primary-action-handler.js";

AFRAME.registerComponent("input-configurator", {
  init() {
    this.inVR = this.el.sceneEl.is("vr-mode");
    this.isMobile = AFRAME.utils.device.isMobile();
    this.eventHandlers = [];
    this.cursor = document.querySelector("#cursor-controller").components["cursor-controller"];
    this.gazeTeleporter = document.querySelector("#gaze-teleport").components["teleport-controls"];
    this.cameraController = document.querySelector("#player-camera").components["camera-controller"];

    this.onEnterVR = this.onEnterVR.bind(this);
    this.onExitVR = this.onExitVR.bind(this);
    this.tearDown = this.tearDown.bind(this);
    this.configureInput = this.configureInput.bind(this);
    this.addLookOnMobile = this.addLookOnMobile.bind(this);

    this.el.sceneEl.addEventListener("enter-vr", this.onEnterVR);
    this.el.sceneEl.addEventListener("exit-vr", this.onExitVR);

    this.tearDown();
    this.configureInput();
  },

  onEnterVR() {
    this.inVR = true;
    this.tearDown();
    this.configureInput();
  },

  onExitVR() {
    this.inVR = false;
    this.tearDown();
    this.configureInput();
  },

  tearDown() {
    this.eventHandlers.forEach(handler => handler.tearDown());
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
      this.cursorRequiresManagement = true;
      this.hovered = false;
      this.primaryActionHandler = new PrimaryActionHandler(this.el.sceneEl, this.cursor);
      this.eventHandlers.push(this.primaryActionHandler);
      if (this.isMobile) {
        this.eventHandlers.push(new GearVRMouseEventHandler(this.cursor, this.gazeTeleporter));
      }
    } else {
      this.cameraController.play();
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

    if (this.cursor.physicalHand) {
      const state = this.cursor.physicalHand.components["super-hands"].state;
      if (!this.hovered && state.has("hover-start") && !this.primaryActionHandler.isCursorInteracting) {
        this.cursor.disable();
        this.hovered = true;
      } else if (this.hovered === true && !state.has("hover-start") && !state.has("grab-start")) {
        this.cursor.enable();
        this.cursor.setCursorVisibility(!this.primaryActionHandler.isTeleporting);
        this.hovered = false;
      }
    }
  }
});
