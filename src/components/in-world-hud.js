AFRAME.registerComponent("in-world-hud", {
  init() {
    this.bg = document.createElement("a-box");
    this.mic = document.createElement("a-image");
    this.nametag = document.createElement("a-text");
    this.avatar = document.createElement("a-image");
    this.el.appendChild(this.bg);
    this.bg.appendChild(this.mic);
    this.bg.appendChild(this.nametag);
    this.bg.appendChild(this.avatar);

    this.bg.setAttribute("position", "0 2.0 -1");
    this.bg.setAttribute("geometry", {
      height: 0.13,
      width: 0.6,
      depth: 0.001
    });
    this.bg.setAttribute("material", {
      color: "#000000",
      opacity: 0.35
    });

    const muted = this.el.sceneEl.is("muted");
    this.mic.setAttribute("src", muted ? "#muted" : "#unmuted");
    this.mic.setAttribute("scale", "-0.1 0.1 0.1");
    this.mic.setAttribute("position", "-0.2 0.0 0.001");
    this.mic.classList.add("menu");

    this.avatar.setAttribute("src", "#avatar");
    const avatarScale = "0.1 0.1 0.1";
    const flipXAvatarScale = "-" + avatarScale;
    this.avatar.setAttribute("scale", avatarScale);
    this.avatar.setAttribute("position", "0.2 0 0.001");
    this.avatar.classList.add("menu");

    this.nametag.setAttribute("scale", "0.3 0.3 0.3");
    this.nametag.setAttribute("position", "-0.12 0 0.0001");
    this.nametag.classList.add("menu");

    const scene = document.querySelector("a-scene");
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

    this.onStateChange = evt => {
      if (evt.detail.state !== "muted") return;
      this.showCorrectMuteState();
    };
    this.showCorrectMuteState = () => {
      this.hoveredOnMic = false;
      const muted = this.el.sceneEl.is("muted");
      this.mic.setAttribute("src", muted ? "#muted" : "#unmuted");
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
    this.mic.addEventListener("raycaster-intersected-cleared", this.showCorrectMuteState);

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
    this.mic.removeEventListener("raycaster-intersected-cleared", this.showCorrectMuteState);

    this.avatar.removeEventListener("raycaster-intersected", this.flipX);
    this.avatar.removeEventListener("raycaster-intersected-cleared", this.unflipX);

    this.el.sceneEl.removeEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateChange);
    this.el.sceneEl.removeEventListener("action_select_hud_item", this.onSelect);
    document.removeEventListener("click", this.onClick);
  },

  onUsernameChanged(evt) {
    var width;
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
