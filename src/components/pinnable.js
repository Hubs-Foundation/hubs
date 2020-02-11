AFRAME.registerComponent("pinnable", {
  schema: {
    pinned: { default: false }
  },

  init() {
    this._fireEventsAndAnimate = this._fireEventsAndAnimate.bind(this);

    // Fire pinned events when media is refreshed since the version will be bumped.
    this.el.addEventListener("media_refreshed", this._fireEventsAndAnimate);

    // Fire pinned events when page changes so we can persist the page.
    this.el.addEventListener("owned-pager-page-changed", this._fireEventsAndAnimate);

    // Fire pinned events when video state changes so we can persist the page.
    this.el.addEventListener("owned-video-state-changed", this._fireEventsAndAnimate);
  },

  update(oldData) {
    this._fireEventsAndAnimate(oldData);
  },

  _fireEventsAndAnimate(oldData, force) {
    // We need to guard against _fireEventsAndAnimate being called during entity initialization,
    // when the networked component isn't initialized yet.
    if (!this.el.components.networked || !this.el.components.networked.data) return;

    const isMine = NAF.utils.isMine(this.el);

    // Avoid firing events during initialization by checking if the pin state has changed before doing so.
    const pinStateChanged = !!oldData.pinned !== this.data.pinned;

    if (this.data.pinned) {
      if (pinStateChanged || force) {
        this.el.emit("pinned", { el: this.el });
      }

      if (isMine) {
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
    } else {
      if (pinStateChanged || force) {
        this.el.emit("unpinned", { el: this.el });
      }
    }
  },

  isHeld(el) {
    const { leftHand, rightHand, rightRemote } = el.sceneEl.systems.interaction.state;
    return leftHand.held === el || rightHand.held === el || rightRemote.held === el;
  },

  tick() {
    const held = this.isHeld(this.el);
    const isMine = this.el.components.networked && this.el.components.networked.data && NAF.utils.isMine(this.el);

    let didFireThisFrame = false;
    if (!held && this.wasHeld && isMine) {
      didFireThisFrame = true;
      this._fireEventsAndAnimate(this.data, true);
    }

    this.wasHeld = held;

    this.transformObjectSystem = this.transformObjectSystem || AFRAME.scenes[0].systems["transform-selected-object"];
    const transforming = this.transformObjectSystem.transforming && this.transformObjectSystem.target.el === this.el;
    if (!didFireThisFrame && !transforming && this.wasTransforming && isMine) {
      this._fireEventsAndAnimate(this.data, true);
    }
    this.wasTransforming = transforming;
  }
});
