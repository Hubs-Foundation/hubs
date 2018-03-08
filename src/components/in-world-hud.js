AFRAME.registerComponent("in-world-hud", {
  schema: {
    haptic: { type: "selector" },
    raycaster: { type: "selector" }
  },
  init() {
    this.bg = this.el.querySelector(".bg");
    this.mic = this.el.querySelector(".mic");
    this.nametag = this.el.querySelector(".nametag");
    this.nametag.object3DMap.text.material.depthTest = false;
    this.avatar = this.el.querySelector(".avatar");
    this.data.raycaster.components.line.material.depthTest = false;

    const muted = this.el.sceneEl.is("muted");
    this.mic.setAttribute("src", muted ? "#muted" : "#unmuted");

    const avatarScale = "0.1 0.1 0.1";
    const flipXAvatarScale = "-" + avatarScale;

    const scene = this.el.sceneEl;
    this.onUsernameChanged = this.onUsernameChanged.bind(this);
    scene.addEventListener("username-changed", this.onUsernameChanged);

    this.onNametagHovered = () => {
      this.nametag.setAttribute("color", "cyan");
      this.data.haptic.emit("haptic_pulse", { intensity: "low" });
    };
    this.onNametagUnhovered = () => {
      this.nametag.setAttribute("color", "white");
    };
    this.onAvatarHovered = () => {
      this.avatar.setAttribute("scale", flipXAvatarScale);
      this.data.haptic.emit("haptic_pulse", { intensity: "low" });
    };
    this.onAvatarUnhovered = () => {
      this.avatar.setAttribute("scale", avatarScale);
    };
    this.onMicHover = () => {
      this.hoveredOnMic = true;
      const muted = scene.is("muted");
      this.mic.setAttribute("src", muted ? "#unmuted" : "#muted");
      this.data.haptic.emit("haptic_pulse", { intensity: "low" });
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
        this.data.haptic.emit("haptic_pulse", { intensity: "low" });
      }
    };

    this.onClick = () => {
      this.el.emit("action_select_hud_item");
    };

    this.onAudioFrequencyChange = e => {
      const red = 1.0 - e.detail.volume / 10.0;
      this.mic.object3DMap.mesh.material.color = { r: red, g: 1, b: 1 };
    };
    this.el.sceneEl.addEventListener("mediaStream", evt => {
      this.ms = evt.detail.ms;
      const ctx = THREE.AudioContext.getContext();
      const source = ctx.createMediaStreamSource(this.ms);
      this.analyser = ctx.createAnalyser();
      this.levels = new Uint8Array(this.analyser.frequencyBinCount);
      source.connect(this.analyser);
    });
  },

  play() {
    this.mic.addEventListener("raycaster-intersected", this.onMicHover);
    this.mic.addEventListener("raycaster-intersected-cleared", this.onMicHoverExit);

    this.nametag.addEventListener("raycaster-intersected", this.onNametagHovered);
    this.nametag.addEventListener("raycaster-intersected-cleared", this.onNametagUnhovered);

    this.avatar.addEventListener("raycaster-intersected", this.onAvatarHovered);
    this.avatar.addEventListener("raycaster-intersected-cleared", this.onAvatarUnhovered);

    this.el.sceneEl.addEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateChange);

    this.el.sceneEl.addEventListener("action_select_hud_item", this.onSelect);
    document.addEventListener("click", this.onClick);

    this.el.sceneEl.addEventListener("micAudio", this.onAudioFrequencyChange);
  },

  pause() {
    this.nametag.removeEventListener("raycaster-intersected", this.onNametagHovered);
    this.nametag.removeEventListener("raycaster-intersected-cleared", this.onNametagUnhovered);

    this.mic.removeEventListener("raycaster-intersected", this.onMicHover);
    this.mic.removeEventListener("raycaster-intersected-cleared", this.onMicHoverExit);

    this.avatar.removeEventListener("raycaster-intersected", this.onAvatarHovered);
    this.avatar.removeEventListener("raycaster-intersected-cleared", this.onAvatarUnhovered);

    this.el.sceneEl.removeEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateChange);

    this.el.sceneEl.removeEventListener("action_select_hud_item", this.onSelect);
    document.removeEventListener("click", this.onClick);

    this.el.sceneEl.removeEventListener("micAudio", this.onAudioFrequencyChange);
  },

  tick: function(t, dt) {
    if (!this.analyser) return;

    this.analyser.getByteFrequencyData(this.levels);

    let sum = 0;
    for (let i = 0; i < this.levels.length; i++) {
      sum += this.levels[i];
    }
    this.volume = sum / this.levels.length;
    this.el.emit("micAudio", {
      volume: this.volume,
      levels: this.levels
    });
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
