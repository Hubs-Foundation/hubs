AFRAME.registerComponent("pinnable", {
  schema: {
    pinned: { default: false }
  },

  init() {
    this._fireEventsAndAnimate = this._fireEventsAndAnimate.bind(this);

    // Fire pinned events when page changes so we can persist the page.
    this.el.addEventListener("pager-page-changed", this._fireEventsAndAnimate);

    // Fire pinned events when video state changes so we can persist the page.
    this.el.addEventListener("owned-video-state-changed", this._fireEventsAndAnimate);
  },

  update(oldData) {
    this._fireEventsAndAnimate(oldData);
  },

  _fireEventsAndAnimate(oldData, force) {
    // during object initialization, we may not have a networked component, and we
    // also have no desire to fire pinned events or animate anything
    if (!this.el.components.networked) {
      return;
    }
    // if someone else pinned it, we don't want to take action
    if (this.el.components.networked.data && !NAF.utils.isMine(this.el)) {
      return;
    }

    const pinStateChanged = !!oldData.pinned !== this.data.pinned;
    if (this.data.pinned) {
      if (pinStateChanged || force) {
        this.el.emit("pinned", { el: this.el });
      }

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

      if (this.el.components["ammo-body"]) {
        this.el.setAttribute("ammo-body", { type: "static" });
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

    if (!held && this.wasHeld) {
      this._fireEventsAndAnimate(this.data, true);
    }

    this.wasHeld = held;
  }
});
