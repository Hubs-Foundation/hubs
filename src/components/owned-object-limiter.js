/* global NAF */
AFRAME.registerComponent("owned-object-limiter", {
  schema: {
    counter: { type: "selector" }
  },

  init() {
    this.counter = this.data.counter.components["networked-counter"];
  },

  isHeld(el) {
    const { leftHand, rightHand, rightRemote } = this.el.sceneEl.systems.interaction.state;
    return leftHand.held === el || rightHand.held === el || rightRemote.held === el;
  },

  tick() {
    this._syncCounterRegistration();
    const isHeld = this.isHeld(this.el);
    if (!isHeld && this.wasHeld && this.counter.timestamps.has(this.el)) {
      this.counter.timestamps.set(this.el, Date.now());
    }
    this.wasHeld = isHeld;
  },

  remove() {
    this.counter.deregister(this.el);
  },

  _syncCounterRegistration() {
    if (!this.el.components["networked"]) return;

    const isPinned = this.el.components["pinnable"] && this.el.components["pinnable"].data.pinned;

    if (NAF.utils.isMine(this.el) && !isPinned) {
      this.counter.register(this.el);
    } else {
      this.counter.deregister(this.el);
    }
  }
});
