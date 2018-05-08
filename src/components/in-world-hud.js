AFRAME.registerComponent("in-world-hud", {
  schema: {
    haptic: { type: "selector" },
    raycaster: { type: "selector" }
  },
  init() {
    this.mic = this.el.querySelector(".mic");
    this.freeze = this.el.querySelector(".freeze");
    this.bubble = this.el.querySelector(".bubble");
    this.background = this.el.querySelector(".bg");
    this.mic.object3DMap.mesh.renderOrder = window.RENDER_ORDER.HUD;
    this.freeze.object3DMap.mesh.renderOrder = window.RENDER_ORDER.HUD;
    this.bubble.object3DMap.mesh.renderOrder = window.RENDER_ORDER.HUD;
    this.background.object3DMap.mesh.renderORder = window.RENDER_ORDER.HUD_BACKGROUND;

    this.updateButtonStates = () => {
      this.mic.setAttribute("icon-button", "active", this.el.sceneEl.is("muted"));
      this.freeze.setAttribute("icon-button", "active", this.el.sceneEl.is("frozen"));
      this.bubble.setAttribute("icon-button", "active", this.el.sceneEl.is("spacebubble"));
    };
    this.updateButtonStates();

    this.onStateChange = evt => {
      if (!(evt.detail === "muted" || evt.detail === "frozen" || evt.detail === "spacebubble")) return;
      this.updateButtonStates();
    };

    this.onMicClick = () => {
      this.el.emit("action_mute");
    };

    this.onFreezeClick = () => {
      this.el.emit("action_freeze");
    };

    this.onBubbleClick = () => {
      this.el.emit("action_space_bubble");
    };
  },

  play() {
    this.el.sceneEl.addEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateChange);

    this.mic.addEventListener("click", this.onMicClick);
    this.freeze.addEventListener("click", this.onFreezeClick);
    this.bubble.addEventListener("click", this.onBubbleClick);
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateChange);

    this.mic.removeEventListener("click", this.onMicClick);
    this.freeze.removeEventListener("click", this.onFreezeClick);
    this.bubble.removeEventListener("click", this.onBubbleClick);
  }
});
