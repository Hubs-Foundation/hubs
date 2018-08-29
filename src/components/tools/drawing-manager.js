/**
 * Drawing Manager
 * Manages what networked-drawings are available to pen components
 * @namespace drawing
 * @component drawing-manager
 */
AFRAME.registerComponent("drawing-manager", {
  schema: {
    drawing: { type: "string" }
  },

  init() {
    this.drawingToPen = new Map();
  },

  play() {
    this.drawing = document.querySelector(this.data.drawing).components["networked-drawing"];
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
