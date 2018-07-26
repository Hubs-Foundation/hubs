/**
 * Pen tool
 * @component pen
 */

function almostEquals(epsilon, u, v) {
  return Math.abs(u.x - v.x) < epsilon && Math.abs(u.y - v.y) < epsilon && Math.abs(u.z - v.z) < epsilon;
}

AFRAME.registerComponent("pen", {
  schema: {
    drawFrequency: { default: 20 },
    minDistanceBetweenPoints: { default: 0.04 },
    defaultDirection: { default: { x: 1, y: 0, z: 0 } },
    camera: { type: "selector" },
    drawing: { type: "string" },
    useMouse: { defualt: false }
  },

  init() {
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    this.startDraw = this.startDraw.bind(this);
    this.endDraw = this.endDraw.bind(this);

    this.isDrawing = false;
    this.timeSinceLastDraw = 0;

    this.lastPosition = new THREE.Vector3();
    this.lastPosition.copy(this.el.object3D.position);

    this.direction = new THREE.Vector3();
    this.direction.copy(this.data.defaultDirection);

    this.handleDrawingInitialized = this.handleDrawingInitialized.bind(this);

    this.drawing = document.querySelector(this.data.drawing);

    if (this.drawing.hasLoaded) {
      this.currentDrawing = this.drawing.components["networked-drawing"];
    } else {
      this.drawing.addEventListener("componentinitialized", this.handleDrawingInitialized);
    }

    this.normal = new THREE.Vector3();

    this.worldPosition = new THREE.Vector3();
  },

  remove() {
    this.drawing.removeEventListener("componentinitialized", this.handleDrawingInitialized);
  },

  play() {
    // if (this.data.useMouse && false) {
    //   document.addEventListener("mousedown", this.onMouseDown);
    //   document.addEventListener("mouseup", this.onMouseUp);
    // }

    // this.el.parentNode.addEventListener("index_down", this.startDraw);
    // this.el.parentNode.addEventListener("index_up", this.endDraw);

    if (!this.data.useMouse) {
      this.el.parentNode.addEventListener("activate-start", this.startDraw);
      this.el.parentNode.addEventListener("activate-end", this.endDraw);
    }
  },

  pause() {
    document.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mouseup", this.onMouseUp);

    this.el.parentNode.removeEventListener("index_down", this.startDraw);
    this.el.parentNode.removeEventListener("index_up", this.endDraw);

    this.el.parentNode.removeEventListener("activate-start", this.startDraw);
    this.el.parentNode.removeEventListener("activate-end", this.endDraw);
  },

  tick(t, dt) {
    this.el.object3D.getWorldPosition(this.worldPosition);
    const drawing = this.currentDrawing;

    if (!almostEquals(0.005, this.worldPosition, this.lastPosition)) {
      this.direction.subVectors(this.worldPosition, this.lastPosition).normalize();
      this.lastPosition.copy(this.worldPosition);
    }

    if (drawing && this.isDrawing) {
      const time = this.timeSinceLastDraw + dt;
      if (
        time >= this.data.drawFrequency &&
        drawing.getLastPoint().distanceTo(this.worldPosition) >= this.data.minDistanceBetweenPoints
      ) {
        this.getNormal(this.normal, this.worldPosition, this.direction);
        drawing.draw(this.worldPosition, this.direction, this.normal);
      }

      this.timeSinceLastDraw = time % this.data.drawFrequency;
    }
  },

  //helper function to get normal of direction of drawing cross direction to camera
  getNormal: (() => {
    const directionToCamera = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    return function(normal, position, direction) {
      if (this.data.camera) {
        directionToCamera.subVectors(position, this.data.camera.object3D.position).normalize();
        normal.crossVectors(direction, directionToCamera);
      } else {
        //TODO remove?
        this.el.object3D.getWorldQuaternion(worldQuaternion);
        normal
          .copy(this.el.object3D.up)
          .applyQuaternion(worldQuaternion)
          .normalize();
      }
    };
  })(),

  handleDrawingInitialized(e) {
    if (e.detail.name === "networked-drawing") {
      this.currentDrawing = this.drawing.components["networked-drawing"];
    }
  },

  onMouseDown(e) {
    if (this.currentDrawing && e.button === 0) {
      this.startDraw();
    }
  },

  onMouseUp(e) {
    if (this.currentDrawing && e.button === 0) {
      this.endDraw();
    }
  },

  startDraw() {
    this.isDrawing = true;
    this.el.object3D.getWorldPosition(this.worldPosition);
    this.getNormal(this.normal, this.worldPosition, this.direction);
    const color = "#" + Math.floor(Math.random() * 16777215).toString(16);
    this.el.setAttribute("material", { color: color });
    this.currentDrawing.startDraw(this.worldPosition, this.direction, this.normal, color);
  },

  endDraw() {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.timeSinceLastDraw = 0;
      this.el.object3D.getWorldPosition(this.worldPosition);
      this.getNormal(this.normal, this.worldPosition, this.direction);
      this.currentDrawing.endDraw(this.worldPosition, this.direction, this.normal);
    }
  }
});
