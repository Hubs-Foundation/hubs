/* global performance */
AFRAME.registerComponent("owned-object-cleanup-timeout", {
  schema: {
    ttl: { default: 0 }
  },

  init() {
    this.timeout = performance.now() + this.data.ttl * 1000;
  },

  tick() {
    if (!this.el.components["networked"] || !NAF.utils.isMine(this.el)) {
      return;
    }

    const isHeld = this.el.sceneEl.systems.interaction.isHeld(this.el);

    if (isHeld) {
      this.timeout = performance.now() + this.data.ttl * 1000;
      return;
    }

    const isPinned = this.el.components["pinnable"] && this.el.components["pinnable"].data.pinned;

    if (!isPinned && performance.now() >= this.timeout) {
      this.el.parentNode.removeChild(this.el);
    }
  }
});
