// Given a function and a queue name, schedules things so a single function
// from a given queue will be called per frame.
AFRAME.registerSystem("frame-scheduler", {
  init() {
    // Registry a map from queue name to list of registered functions.
    this.registry = new Map();
    this.queues = [];
    this.frameIndex = 0;
  },

  schedule(func, queue) {
    if (!this.registry.has(queue)) {
      this.queues.push(queue);
      this.registry.set(queue, []);
    }

    this.registry.get(queue).push(func);
  },

  unschedule(func) {
    for (let i = 0; i < this.queues.length; i++) {
      const queue = this.queues[i];
      const entries = this.registry.get(queue);
      const idx = entries.indexOf(func);

      if (idx >= 0) {
        entries.splice(idx, 1);
      }
    }
  },

  tick: function() {
    for (let i = 0; i < this.queues.length; i++) {
      const queue = this.queues[i];
      const entries = this.registry.get(queue);
      if (entries.length === 0) continue;

      entries[this.frameIndex % entries.length]();
    }

    this.frameIndex++;
  }
});
