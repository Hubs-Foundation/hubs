AFRAME.registerComponent("hover-menu", {
  multiple: true,
  schema: {
    template: { type: "selector" },
    dirs: { type: "array" }
  },

  async init() {
    this.onHoverStateChange = this.onHoverStateChange.bind(this);
    this.onFrozenStateChange = this.onFrozenStateChange.bind(this);

    this.hovering = this.el.parentNode.is("hovered");

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
          target: ".video-toolbar",
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

  onHoverStateChange(e) {
    this.hovering = e.type === "hover-start";
    this.applyHoverState();
  },

  applyHoverState() {
    if (!this.menu) return;
    this.menu.object3D.visible = !this.el.sceneEl.is("frozen") && this.hovering;
  },

  play() {
    this.el.addEventListener("hover-start", this.onHoverStateChange);
    this.el.addEventListener("hover-end", this.onHoverStateChange);
    this.el.sceneEl.addEventListener("stateadded", this.onFrozenStateChange);
    this.el.sceneEl.addEventListener("stateremoved", this.onFrozenStateChange);
  },

  pause() {
    this.el.removeEventListener("hover-start", this.onHoverStateChange);
    this.el.removeEventListener("hover-end", this.onHoverStateChange);
    this.el.sceneEl.removeEventListener("stateadded", this.onFrozenStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this.onFrozenStateChange);
  }
});
