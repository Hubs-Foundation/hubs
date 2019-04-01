AFRAME.registerComponent("tags", {
  schema: {
    isHoldable: { default: false },
    offersHandConstraint: { default: false },
    offersRemoteConstraint: { default: false },
    singleActionButton: { default: false },
    holdableButton: { default: false },
    isPen: { default: false },
    isHoverMenuChild: { default: false }
  },
  update() {
    if (this.didUpdateOnce) {
      console.error("Do not edit tags with .setAttribute");
    }
    this.didUpdateOnce = true;
  }
});
