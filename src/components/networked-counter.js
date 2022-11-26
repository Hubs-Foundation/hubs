/**
 * Limits networked interactables to a maximum number at any given time
 * @namespace network
 * @component networked-counter
 */
AFRAME.registerComponent("networked-counter", {
  schema: {
    max: { default: 3 }
  },

  init() {
    this.timestamps = new Map();
    this.el.object3D.visible = false;
  },

  remove() {
    this.timestamps.clear();
  },

  count() {
    return this.timestamps.size;
  },

  register(el) {
    if (this.data.max <= 0 || this.timestamps.has(el)) return;

    this.timestamps.set(el, performance.now());
    if (this.timestamps.size > this.data.max) {
      this._destroyOldest();
    }
  },

  deregister(el) {
    if (!this.timestamps.has(el)) return;
    this.timestamps.delete(el);
  },

  _destroyOldest() {
    const interaction = this.el.sceneEl.systems.interaction;
    let oldestEl = null,
      minTs = Number.MAX_VALUE;
    this.timestamps.forEach((ts, el) => {
      if (ts < minTs && !interaction.isHeld(el) && NAF.utils.isMine(el)) {
        oldestEl = el;
        minTs = ts;
      }
    });
    this._destroy(oldestEl);
  },

  _destroy(el) {
    // Pause the entity so that it won't just re-register itself immediately in owned-object-limiter.
    el.pause();
    // networked-interactable's remove will also call deregister, but it will happen async so we do it here as well.
    this.deregister(el);
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
});
