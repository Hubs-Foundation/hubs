AFRAME.registerSystem("components-queue", {
  init() {
    // Registry a map from queue name to another map, which is a map from component object to its assigned index.
    // Indicies range from 0 to N - 1 where N is the number of registered components in the queue.
    // The shouldTick method returns true for the component whose index is the mod of the current frame index.
    this.registry = new Map();
    this.componentToQueue = new Map();
    this.frameIndex = 0;
  },

  register(component, queue = component.name) {
    if (!this.registry.has(queue)) {
      this.registry.set(queue, new Map());
    }

    this.componentToQueue.set(component, queue);

    const components = this.registry.get(queue);
    components.set(component, components.size);

    const removalHandler = evt => {
      if (evt.detail.name !== component.name) return;

      const queue = this.componentToQueue.get(component);
      this.registry.get(queue, component).delete(component);
      this.componentToQueue.delete(component);

      let i = 0;

      for (const k of components.keys()) {
        components.set(k, i++);
      }

      component.el.removeEventListener("componentremoved", removalHandler);
    };

    component.el.addEventListener("componentremoved", removalHandler);
  },

  shouldTick(component) {
    const queue = this.componentToQueue.get(component);
    if (!queue) return false;

    const entries = this.registry.get(queue);
    return this.frameIndex % entries.size === entries.get(component);
  },

  tick() {
    this.frameIndex++;
  }
});
