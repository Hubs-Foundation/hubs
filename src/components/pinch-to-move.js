AFRAME.registerComponent("pinch-to-move", {
  schema: {
    speed: { default: 0.35 }
  },
  init() {
    this.onPinch = this.onPinch.bind(this);
    this.axis = [0, 0];
    this.pinch = 0;
    this.prevPinch = 0;
    this.needsMove = false;
  },
  play() {
    this.el.addEventListener("pinch", this.onPinch);
  },
  pause() {
    this.el.removeEventListener("pinch", this.onPinch);
  },
  tick() {
    if (this.needsMove) {
      const diff = this.pinch - this.prevPinch;
      this.axis[1] = diff * this.data.speed;
      this.el.emit("move", { axis: this.axis });
      this.prevPinch = this.pinch;
    }
    this.needsMove = false;
  },
  onPinch(e) {
    const { isNewPinch, distance } = e.detail;
    if (isNewPinch) {
      this.prevPinch = distance;
      return;
    }
    this.pinch = distance;
    this.needsMove = true;
  }
});
