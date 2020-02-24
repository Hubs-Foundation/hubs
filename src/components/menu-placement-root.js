AFRAME.registerComponent("menu-placement-root", {
  multiple: true,
  schema: {
    menuSelector: { type: "string" }
  },
  init() {
    this.didRegisterWithSystems = false;
  },
  tick() {
    // Can't register with the system in init() or play() because menus do not seem to exist yet
    // under elements loaded from objects.gltf (The pinned room objects).
    if (!this.didRegisterWithSystems && !this.didTryRegisterWithSystems) {
      this.didTryRegisterWithSystems = true;
      const systems = this.el.sceneEl.systems["hubs-systems"];
      const menuEl = this.el.querySelector(this.data.menuSelector);
      if (!menuEl) {
        console.error("can't find menu el with this selector", this.data.menuSelector, this.el);
        return;
      }
      this.didRegisterWithSystems = true;
      systems.menuPlacementSystem.register(this, menuEl);
      systems.menuAnimationSystem.register(this, menuEl);
    }
  },
  remove() {
    if (this.didRegisterWithSystems) {
      const systems = this.el.sceneEl.systems["hubs-systems"];
      systems.menuPlacementSystem.unregister(this);
      systems.menuAnimationSystem.unregister(this);
    }
  }
});
