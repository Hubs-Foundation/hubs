/**
 * Drawing Manager
 * Manages what networked-drawings are available to pen components
 * @namespace drawing
 * @component drawing-manager
 */
AFRAME.registerComponent("drawing-manager", {
  init() {
    this._onComponentInitialized = this._onComponentInitialized.bind(this);

    this.drawingToPen = new Map();
  },

  remove() {
    if (this.drawingEl) {
      this.drawingEl.removeEventListener("componentinitialized", this._onComponentInitialized);
    }
  },

  _onComponentInitialized(e) {
    if (e.detail.name == "networked-drawing") {
      this.drawing = this.drawingEl.components["networked-drawing"];
    }
  },

  createDrawing() {
    if (!this.drawingEl) {
      this.drawingEl = document.createElement("a-entity");
      this.drawingEl.setAttribute("networked", "template: #interactable-drawing");
      this.el.sceneEl.appendChild(this.drawingEl);

      this.drawingEl.addEventListener("componentinitialized", this._onComponentInitialized);
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
