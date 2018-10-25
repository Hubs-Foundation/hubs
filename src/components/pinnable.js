AFRAME.registerComponent("pinnable", {
  schema: {
    pinned: { default: false }
  },

  init() {
    this.scene = document.querySelector("a-scene");
    this._apply = this._apply.bind(this);

    this.el.sceneEl.addEventListener("stateadded", this._apply);
    this.el.sceneEl.addEventListener("stateremoved", this._apply);
  },

  remove() {
    this.el.sceneEl.removeEventListener("stateadded", this._apply);
    this.el.sceneEl.removeEventListener("stateremoved", this._apply);
  },

  update() {
    this._apply();

    if (this.data.pinned) {
      this.el.emit("pinned");
      this.scene.emit("object_pinned", { el: this.el });
    } else {
      this.el.emit("unpinned");
      this.scene.emit("object_unpinned", { el: this.el });
    }
  },

  _apply() {
    const isFrozen = this.el.sceneEl.is("frozen");

    if (this.data.pinned && !isFrozen) {
      if (this.el.components.grabbable && this.el.components.grabbable.data.maxGrabbers !== 0) {
        this.prevMaxGrabbers = this.el.components.grabbable.data.maxGrabbers;
      }

      this.el.setAttribute("body", { type: "static" });
      this.el.setAttribute("grabbable", { maxGrabbers: 0 });
      this.el.removeAttribute("stretchable");
    } else {
      if (typeof this.prevMaxGrabbers !== "undefined") {
        this.el.setAttribute("grabbable", { maxGrabbers: this.prevMaxGrabbers });
      }

      this.el.setAttribute("stretchable", "");
    }
  }
});
