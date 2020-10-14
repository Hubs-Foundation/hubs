export function isTagged(el, tag) {
  return el && el.components && el.components.tags && el.components.tags.data[tag];
}

export function setTag(el, tag, value = true) {
  return (el.components.tags.data[tag] = !!value);
}

AFRAME.registerComponent("tags", {
  schema: {
    isHandCollisionTarget: { default: false },
    isHoldable: { default: false },
    offersHandConstraint: { default: false },
    offersRemoteConstraint: { default: false },
    togglesHoveredActionSet: { default: false },
    singleActionButton: { default: false },
    holdableButton: { default: false },
    isPen: { default: false },
    isHoverMenuChild: { default: false },
    isStatic: { default: false },
    inspectable: { default: false },
    preventAudioBoost: { default: false }
  },
  update() {
    if (this.didUpdateOnce) {
      console.warn("Do not edit tags with .setAttribute");
    }
    this.didUpdateOnce = true;
  },

  remove() {
    const interaction = this.el.sceneEl.systems.interaction;
    if (interaction.isHeld(this.el)) {
      interaction.release(this.el);
      this.el.sceneEl.systems["hubs-systems"].constraintsSystem.release(this.el);
    }
  }
});
