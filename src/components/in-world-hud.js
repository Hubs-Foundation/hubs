/**
 * HUD panel for muting, freezing, and space bubble controls.
 * @namespace ui
 * @component in-world-hud
 */
AFRAME.registerComponent("in-world-hud", {
  schema: {
    haptic: { type: "selector" },
    raycaster: { type: "selector" }
  },
  init() {
    this.mic = this.el.querySelector(".mic");
    this.freeze = this.el.querySelector(".freeze");
    this.pen = this.el.querySelector(".penhud");
    this.cameraBtn = this.el.querySelector(".cameraBtn");
    this.background = this.el.querySelector(".bg");
    const renderOrder = window.APP.RENDER_ORDER;
    this.mic.object3DMap.mesh.renderOrder = renderOrder.HUD_ICONS;
    this.freeze.object3DMap.mesh.renderOrder = renderOrder.HUD_ICONS;
    this.pen.object3DMap.mesh.renderOrder = renderOrder.HUD_ICONS;
    this.cameraBtn.object3DMap.mesh.renderOrder = renderOrder.HUD_ICONS;
    this.background.object3DMap.mesh.renderORder = renderOrder.HUD_BACKGROUND;

    this.updateButtonStates = () => {
      this.mic.setAttribute("icon-button", "active", this.el.sceneEl.is("muted"));
      this.freeze.setAttribute("icon-button", "active", this.el.sceneEl.is("frozen"));
      this.pen.setAttribute("icon-button", "active", this.el.sceneEl.is("pen"));
    };
    this.updateButtonStates();

    this.onStateChange = evt => {
      if (!(evt.detail === "muted" || evt.detail === "frozen" || evt.detail === "pen")) return;
      console.log(evt);
      this.updateButtonStates();
    };

    this.onMicClick = e => {
      console.log(e);
      this.el.emit("action_mute");
    };

    this.onFreezeClick = e => {
      console.log(e);
      this.el.emit("action_freeze");
    };

    this.onPenClick = e => {
      console.log(e);
      this.el.emit("spawn_pen");
    };

    this.onCameraClick = e => {
      console.log(e);
      this.el.emit("action_spawn_camera");
    };
  },

  play() {
    this.el.sceneEl.addEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateChange);

    this.mic.addEventListener("mousedown", this.onMicClick);
    this.freeze.addEventListener("mousedown", this.onFreezeClick);
    this.pen.addEventListener("mousedown", this.onPenClick);
    this.cameraBtn.addEventListener("mousedown", this.onCameraClick);
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateChange);

    this.mic.removeEventListener("mousedown", this.onMicClick);
    this.freeze.removeEventListener("mousedown", this.onFreezeClick);
    this.pen.removeEventListener("mousedown", this.onPenClick);
    this.cameraBtn.removeEventListener("mousedown", this.onCameraClick);
  }
});
