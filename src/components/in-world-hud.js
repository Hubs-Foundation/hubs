AFRAME.registerComponent("in-world-hud", {
  init() {
    this.bg = this.el.querySelector(".bg");
    this.mic = this.el.querySelector(".mic");
    this.nametag = this.el.querySelector(".nametag");
    this.nametag.object3DMap.text.material.depthTest = false;
    this.avatar = this.el.querySelector(".avatar");

    const muted = this.el.sceneEl.is("muted");
    this.mic.setAttribute("src", muted ? "#muted" : "#unmuted");

    const avatarScale = "0.1 0.1 0.1";
    const flipXAvatarScale = "-" + avatarScale;

    const scene = this.el.sceneEl;
    this.onUsernameChanged = this.onUsernameChanged.bind(this);
    scene.addEventListener("username-changed", this.onUsernameChanged);

    this.addBlue = () => {
      this.nametag.setAttribute("color", "cyan");
    };
    this.removeBlue = () => {
      this.nametag.setAttribute("color", "white");
    };
    this.flipX = () => {
      this.avatar.setAttribute("scale", flipXAvatarScale);
    };
    this.unflipX = () => {
      this.avatar.setAttribute("scale", avatarScale);
    };
    this.onMicHover = () => {
      this.hoveredOnMic = true;
      const muted = scene.is("muted");
      this.mic.setAttribute("src", muted ? "#unmuted" : "#muted");
    };

    this.showCorrectMuteState = () => {
      const muted = this.el.sceneEl.is("muted");
      this.mic.setAttribute("src", muted ? "#muted" : "#unmuted");
    };

    this.onStateChange = evt => {
      if (evt.detail !== "muted") return;
      this.showCorrectMuteState();
    };

    this.onMicHoverExit = () => {
      this.hoveredOnMic = false;
      this.showCorrectMuteState();
    };

    this.onSelect = evt => {
      if (this.hoveredOnMic) {
        this.el.emit("action_mute");
      }
    };

    this.onClick = () => {
      this.el.emit("action_select_hud_item");
    };
  },

  play() {
    this.mic.addEventListener("raycaster-intersected", this.onMicHover);
    this.mic.addEventListener("raycaster-intersected-cleared", this.onMicHoverExit);

    this.nametag.addEventListener("raycaster-intersected", this.addBlue);
    this.nametag.addEventListener("raycaster-intersected-cleared", this.removeBlue);

    this.avatar.addEventListener("raycaster-intersected", this.flipX);
    this.avatar.addEventListener("raycaster-intersected-cleared", this.unflipX);

    this.el.sceneEl.addEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateChange);

    this.el.sceneEl.addEventListener("action_select_hud_item", this.onSelect);
    document.addEventListener("click", this.onClick);
  },

  pause() {
    this.nametag.removeEventListener("raycaster-intersected", this.addBlue);
    this.nametag.removeEventListener("raycaster-intersected-cleared", this.removeBlue);

    this.mic.removeEventListener("raycaster-intersected", this.onMicHover);
    this.mic.removeEventListener("raycaster-intersected-cleared", this.onMicHoverExit);

    this.avatar.removeEventListener("raycaster-intersected", this.flipX);
    this.avatar.removeEventListener("raycaster-intersected-cleared", this.unflipX);

    this.el.sceneEl.removeEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateChange);
    this.el.sceneEl.removeEventListener("action_select_hud_item", this.onSelect);
    document.removeEventListener("click", this.onClick);
  },

  onUsernameChanged(evt) {
    let width;
    if (evt.detail.username.length == 0) {
      width = 1;
    } else {
      width = 40 / evt.detail.username.length;
    }
    const maxWidth = 6;
    if (width > maxWidth) {
      width = maxWidth;
    }

    this.nametag.setAttribute("text", "width", width);
    this.nametag.setAttribute("text", "value", evt.detail.username);
    this.nametag.components["text"].updateFont();
  }
});
