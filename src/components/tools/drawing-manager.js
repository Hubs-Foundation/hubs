/**
 * Drawing Manager
 * Manages what networked-drawings are available to pen components
 * @namespace drawing
 * @component drawing-manager
 */
AFRAME.registerComponent("drawing-manager", {
  init() {
    this.el.object3D.visible = false;
    this.drawingToPen = new Map();
  },

  createDrawing() {
    return new Promise(resolve => {
      this.drawingEl = document.createElement("a-entity");
      this.drawingEl.setAttribute("networked", "template: #interactable-drawing");
      this.el.sceneEl.appendChild(this.drawingEl);

      const handNetworkedDrawingInit = e => {
        if (e.detail.name === "networked-drawing") {
          this.drawing = this.drawingEl.components["networked-drawing"];
          this.drawingEl.removeEventListener("componentinitialized", handNetworkedDrawingInit);
          resolve();
        }
      };

      this.drawingEl.addEventListener("componentinitialized", handNetworkedDrawingInit);
    });
  },

  destroyDrawing(networkedDrawing) {
    if (this.drawing === networkedDrawing) {
      this.drawingToPen.delete(this.drawing);
      this.drawing = null;
      this.drawingEl = null;
    }
  },

  getDrawing(pen) {
    //TODO: future handling of multiple drawings
    return new Promise((resolve, reject) => {
      if (!this.drawingEl) {
        this.createDrawing().then(() => {
          this.drawingToPen.set(this.drawing, pen);
          resolve(this.drawing);
        });
      } else if (
        this.drawing &&
        (!this.drawingToPen.has(this.drawing) || this.drawingToPen.get(this.drawing) === pen)
      ) {
        this.drawingToPen.set(this.drawing, pen);
        resolve(this.drawing);
      } else {
        reject();
      }
    });
  },

  returnDrawing(pen) {
    if (this.drawingToPen.has(this.drawing) && this.drawingToPen.get(this.drawing) === pen) {
      this.drawingToPen.delete(this.drawing);
    }
  }
});
