AFRAME.registerSystem("components-queue", {
  init() {
    this.registry = new Map();
    this.componentToQueue = new Map();
    this.frameIndex = 0;
  },

  register(component, queue = component.name) {
    if (!this.registry.has(queue)) {
      this.registry.set(queue, []);
    }

    const components = this.registry.get(queue);
    components[components.length] = component;

    this.componentToQueue.set(component, queue);
    const removalHandler = evt => {
      if (evt.detail.name !== component.name) return;

      const queue = this.componentToQueue.get(component);
      this.registry.set(queue, this.registry.get(queue).filter(x => component !== x));
      this.componentToQueue.delete(component);
      component.el.removeEventListener("componentremoved", removalHandler);
    };

    component.el.addEventListener("componentremoved", removalHandler);
  },

  shouldTick(component) {
    const queue = this.componentToQueue.get(component);
    if (!queue) return false;

    const entries = this.registry.get(queue);
    return this.frameIndex % entries.length === entries.indexOf(component);
  },

  tick() {
    this.frameIndex++;
  }
});
