AFRAME.registerComponent("hover-menu", {
  multiple: true,
  schema: {
    template: { type: "selector" },
    dirs: { type: "array" },
    dim: { default: true }
  },

  async init() {
    this.onFrozenStateChange = this.onFrozenStateChange.bind(this);

    this.hovering = this.isHovered();
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
        this.el.setAttribute("position-at-box-shape-border", {
          target: ".hover-container",
          dirs: this.data.dirs,
          animate: false,
          scale: false
        });
        resolve(this.menu);
      });
    }));
  },

  onFrozenStateChange(e) {
    if (!e.detail === "frozen") return;
    this.applyHoverState();
  },

  isHovered() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const rightRemoteHoverTarget = interaction.rightRemoteHoverTarget;
    if (!rightRemoteHoverTarget) {
      return false;
    }
    if (this.el.parentNode && rightRemoteHoverTarget === this.el.parentNode) {
      return true;
    }
    let childOrSelfIsHovered = false;
    this.el.object3D.traverse(o => {
      if (!o.el) return;
      if (o.el === rightRemoteHoverTarget) {
        childOrSelfIsHovered = true;
      }
    });
    return childOrSelfIsHovered;
  },

  tick() {
    this.hovering = this.isHovered();
    this.applyHoverState();
  },

  applyHoverState() {
    if (!this.menu) return;
    this.menu.object3D.visible = !this.el.sceneEl.is("frozen") && this.hovering;
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
