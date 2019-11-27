/**
 * Drawing Manager
 * Manages what networked-drawings are available to pen components
 * @namespace drawing
 * @component drawing-manager
 */
AFRAME.registerComponent("drawing-manager", {
  schema: {
    penSpawner: { type: "selector" }
  },

  init() {
    this.el.object3D.visible = false;
    this.drawingToPen = new Map();
    this.data.penSpawner.addEventListener("spawned-entity-created", () => {
      if (!this.drawingEl) {
        this.createDrawing();
      }
    });
  },

  createDrawing() {
    if (!this.createDrawingPromise) {
      this.createDrawingPromise = new Promise(resolve => {
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
    }
    return this.createDrawingPromise;
  },

  destroyDrawing(networkedDrawing) {
    if (this.drawing === networkedDrawing) {
      this.drawingToPen.delete(this.drawing);
      this.drawing = null;
      this.drawingEl = null;
      this.createDrawingPromise = null;
      this.getDrawingPromise = null;
    }
  },

  getDrawing(pen) {
    //TODO: future handling of multiple drawings
    if (!this.getDrawingPromise) {
      this.getDrawingPromise = new Promise((resolve, reject) => {
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
    }
    return this.getDrawingPromise;
  },

  returnDrawing(pen) {
    if (this.drawingToPen.has(this.drawing) && this.drawingToPen.get(this.drawing) === pen) {
      this.drawingToPen.delete(this.drawing);
    }
  }
});
