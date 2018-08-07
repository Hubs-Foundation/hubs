/**
 * Drawing Manager
 * @component drawing-manager
 */
AFRAME.registerComponent("drawing-manager", {
  schema: {
    drawing: { type: "string" }
  },

  init() {
    this.handleDrawingInitialized = this.handleDrawingInitialized.bind(this);

    // this.drawingEl = document.querySelector(this.data.drawing);
    this.drawingToPen = new Map();

    // if (this.drawingEl.hasLoaded) {
    //   this.drawing = this.drawingEl.components["networked-drawing"];
    // } else {
    //   this.drawingEl.addEventListener("componentinitialized", this.handleDrawingInitialized);
    // }
  },

  remove() {
    // this.drawingEl.removeEventListener("componentinitialized", this.handleDrawingInitialized);
  },

  play() {
    this.drawing = document.querySelector(this.data.drawing).components["networked-drawing"];
  },

  pause() {},

  handleDrawingInitialized(e) {
    if (e.detail.name === "networked-drawing") {
      this.drawing = this.drawingEl.components["networked-drawing"];
    }
  },

  getDrawing(pen) {
    //TODO: future handling of multiple drawings
    if (this.drawing && (!this.drawingToPen.has(this.drawing) || this.drawingToPen.get(this.drawing) === pen)) {
      this.drawingToPen.set(this.drawing, pen);
      return this.drawing;
    }

    return null;
  },

  returnDrawing(pen) {
    if (this.drawingToPen.has(this.drawing) && this.drawingToPen.get(this.drawing) === pen) {
      this.drawingToPen.delete(this.drawing);
    }
  }
});
