export function isTagged(el, tag) {
  if (!el) {
    return false;
  }

  if (el.isECSYEntity) {
    if (typeof tag === "string") {
      return false;
    }

    return el.hasComponent(tag);
  }

  return el.components && el.components.tags && el.components.tags.data[tag];
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
    inspectable: { default: false }
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
