AFRAME.registerComponent("pinnable", {
  schema: {
    pinned: { default: false }
  },

  init() {
    this._persist = this._persist.bind(this);
    this._persistAndAnimate = this._persistAndAnimate.bind(this);

    // Persist when media is refreshed since the version will be bumped.
    this.el.addEventListener("media_refreshed", this._persistAndAnimate);

    this.el.addEventListener("owned-pager-page-changed", this._persist);

    this.el.addEventListener("owned-video-state-changed", this._persistAndAnimate);
  },

  update() {
    this._animate();
  },

  _persistAndAnimate() {
    this._persist();
    this._animate();
  },

  _persist() {
    // Re-pin or unpin entity to reflect state changes.
    window.APP.pinningHelper.setPinned(this.el, this.data.pinned);
  },

  _isMine() {
    return this.el.components.networked?.data && NAF.utils.isMine(this.el);
  },

  _animate() {
    const isAnimationRunning =
      this.el.components["animation__pin-start"]?.animationIsPlaying ||
      this.el.components["animation__pin-end"]?.animationIsPlaying;

    if (this._isMine() && this.data.pinned && !isAnimationRunning) {
      this.el.removeAttribute("animation__pin-start");
      this.el.removeAttribute("animation__pin-end");
      const currentScale = this.el.object3D.scale;

      this.el.setAttribute("animation__pin-start", {
        property: "scale",
        dur: 200,
        from: { x: currentScale.x, y: currentScale.y, z: currentScale.z },
        to: { x: currentScale.x * 1.1, y: currentScale.y * 1.1, z: currentScale.z * 1.1 },
        easing: "easeOutElastic"
      });

      this.el.setAttribute("animation__pin-end", {
        property: "scale",
        delay: 200,
        dur: 200,
        from: { x: currentScale.x * 1.1, y: currentScale.y * 1.1, z: currentScale.z * 1.1 },
        to: { x: currentScale.x, y: currentScale.y, z: currentScale.z },
        easing: "easeOutElastic"
      });

      if (this.el.components["body-helper"] && !this.el.sceneEl.systems.interaction.isHeld(this.el)) {
        this.el.setAttribute("body-helper", { type: "kinematic" });
      }
    }
  },

  tick() {
    const isHeld = this.el.sceneEl.systems.interaction.isHeld(this.el);
    const isMine = this._isMine();

    let didFireThisFrame = false;
    if (!isHeld && this.wasHeld && isMine) {
      didFireThisFrame = true;
      this._persistAndAnimate();
    }

    this.wasHeld = isHeld;

    this.transformObjectSystem = this.transformObjectSystem || AFRAME.scenes[0].systems["transform-selected-object"];
    const transforming = this.transformObjectSystem.transforming && this.transformObjectSystem.target.el === this.el;
    if (!didFireThisFrame && !transforming && this.wasTransforming && isMine) {
      this._persistAndAnimate();
    }
    this.wasTransforming = transforming;
  }
});
