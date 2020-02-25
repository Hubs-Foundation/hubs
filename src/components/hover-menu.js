AFRAME.registerComponent("hover-menu", {
  multiple: true,
  schema: {
    template: { type: "selector" },
    isFlat: { default: true },
    dim: { default: true },
    withPermission: { type: "string" }
  },

  async init() {
    this.onFrozenStateChange = this.onFrozenStateChange.bind(this);
    this.hovering = false;
    await this.getHoverMenu();
    this.applyHoverState();
  },

  getHoverMenu() {
    if (this.menuPromise) return this.menuPromise;
    return (this.menuPromise = new Promise(resolve => {
      const menu = this.el.appendChild(document.importNode(this.data.template.content, true).children[0]);
      // we have to wait a tick for the attach callbacks to get fired for the elements in a template
      setTimeout(() => {
        this.menu = menu;

        // HACK workaround for now due to position-at-box-shape-border having problems
        // with nested entities, when using 'mirror' viewing.
        //
        // TODO Revisit once that component is removed/deprecated. If we disable repositioning,
        // the menu will only appear on the front of the object (which is fine for our purposes)
        const isMirroredMedia = this.el.parentEl.id === "media-mirror-target";
        const enableRepositioning = !isMirroredMedia;

        if (enableRepositioning) {
          this.el.setAttribute("position-at-border", {
            target: ".hover-container",
            isFlat: this.data.isFlat,
            animate: false,
            scale: false
          });
        } else {
          const hoverContainer = this.el.querySelector(".hover-container");
          hoverContainer.object3D.position.z = 0.001;
          hoverContainer.object3D.matrixNeedsUpdate = true;
        }

        resolve(this.menu);
      });
    }));
  },

  onFrozenStateChange(e) {
    if (!e.detail === "frozen") return;
    this.applyHoverState();
  },

  applyHoverState() {
    if (!this.menu) return;
    const allowed = !this.data.withPermission || window.APP.hubChannel.canOrWillIfCreator(this.data.withPermission);
    this.menu.object3D.visible = allowed && !this.el.sceneEl.is("frozen") && this.hovering;
    if (this.data.dim && this.el.object3DMap.mesh && this.el.object3DMap.mesh.material) {
      this.el.object3DMap.mesh.material.color.setScalar(this.menu.object3D.visible ? 0.5 : 1);
    }
  },

  play() {
    this.el.sceneEl.addEventListener("stateadded", this.onFrozenStateChange);
    this.el.sceneEl.addEventListener("stateremoved", this.onFrozenStateChange);
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this.onFrozenStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this.onFrozenStateChange);
  }
});
