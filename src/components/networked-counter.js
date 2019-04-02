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

    this.timestamps.set(el, Date.now());
    this._destroyOldest();
  },

  deregister(el) {
    if (this.timestamps.has(el)) {
      this.timestamps.delete(el);
    }
  },

  isHeld(el) {
    const { leftHand, rightHand, rightRemote } = this.el.sceneEl.systems.interaction.state;
    return leftHand.held === el || rightHand.held === el || rightRemote.held === el;
  },

  _destroyOldest() {
    if (this.timestamps.size > this.data.max) {
      let oldestEl = null,
        minTs = Number.MAX_VALUE;
      this.timestamps.forEach((ts, el) => {
        if (ts < minTs && !this.isHeld(el)) {
          oldestEl = el;
          minTs = ts;
        }
      });
      this._destroy(oldestEl);
    }
  },

  _destroy(el) {
    // networked-interactable's remvoe will also call deregister, but it will happen async so we do it here as well.
    this.deregister(el);
    el.parentNode.removeChild(el);
  }
});
