const EPS = 10e-6;

/**
 * Pen tool
 * @component pen
 */

AFRAME.registerComponent("pen", {
  schema: {
    drawFrequency: { default: 100 },
    minDistanceBetweenPoints: { default: 0.05 },
    defaultDirection: { default: { x: 1, y: 0, z: 0 } },
    camera: { type: "selector" },
    drawing: { type: "selector" }
  },

  init() {
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    this.isDrawing = false;
    this.timeSinceLastDraw = 0;

    this.lastPosition = new THREE.Vector3();
    this.lastPosition.copy(this.el.object3D.position);
    this.direction = new THREE.Vector3();
    this.direction.copy(this.data.defaultDirection);

    this.handleDrawingInitialized = this.handleDrawingInitialized.bind(this);

    this.data.drawing.addEventListener("componentinitialized", this.handleDrawingInitialized);
  },

  remove() {
    this.data.drawing.removeEventListener("componentinitialized", this.handleDrawingInitialized);
  },

  play() {
    document.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mouseup", this.onMouseUp);
  },

  pause() {
    document.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mouseup", this.onMouseUp);
  },

  tick(t, dt) {
    const currentPosition = this.el.object3D.position;
    const drawing = this.currentDrawing;

    if (drawing && currentPosition.distanceToSquared(this.lastPosition) > EPS) {
      this.direction.subVectors(currentPosition, drawing.getLastPoint()).normalize();
    }
    this.lastPosition.copy(currentPosition);

    if (drawing && this.isDrawing) {
      const time = this.timeSinceLastDraw + dt;
      if (
        time >= this.data.drawFrequency &&
        drawing.getLastPoint().distanceTo(currentPosition) >= this.data.minDistanceBetweenPoints
      ) {
        drawing.addPoint(currentPosition, this.direction);
      }

      this.timeSinceLastDraw = time % this.data.drawFrequency;
    }
  },

  handleDrawingInitialized(e) {
    if (e.detail.name === "networked-drawing") {
      this.currentDrawing = this.data.drawing.components["networked-drawing"];
    }
  },

  onMouseDown(e) {
    if (this.currentDrawing && e.button === 0) {
      this.isDrawing = true;
      this.currentDrawing.startDraw(this.el.object3D.position, this.direction);
    }
  },

  onMouseUp(e) {
    if (this.currentDrawing && e.button === 0) {
      this.isDrawing = false;
      this.currentDrawing.endDraw(this.el.object3D.position, this.direction);
    }
  }
});
