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
    drawingManager: { type: "string" },
    availableColors: {
      default: ["#FF0033", "#FFFF00", "#00FF33", "#0099FF", "#9900FF", "#FFFFFF", "#000000"]
    }
  },

  init() {
    this.stateAdded = this.stateAdded.bind(this);
    this.stateRemoved = this.stateRemoved.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);
    this.onComponentChanged = this.onComponentChanged.bind(this);

    this.timeSinceLastDraw = 0;

    this.lastPosition = new THREE.Vector3();
    this.lastPosition.copy(this.el.object3D.position);

    this.direction = new THREE.Vector3();
    this.direction.copy(this.data.defaultDirection);

    this.currentDrawing = null;

    this.normal = new THREE.Vector3();

    this.worldPosition = new THREE.Vector3();

    this.colorIndex = 0;

    this.grabbed = false;
  },

  play() {
    this.drawingManager = document.querySelector(this.data.drawingManager).components["drawing-manager"];

    this.el.parentNode.addEventListener("stateadded", this.stateAdded);
    this.el.parentNode.addEventListener("stateremoved", this.stateRemoved);
    this.el.addEventListener("onComponentChanged", this.onComponentChanged);
    document.addEventListener("wheel", this.onMouseWheel);
  },

  pause() {
    this.el.parentNode.removeEventListener("stateadded", this.stateAdded);
    this.el.parentNode.removeEventListener("stateremoved", this.stateRemoved);
    this.el.removeEventListener("onComponentChanged", this.onComponentChanged);

    document.removeEventListener("wheel", this.onMouseWheel);
  },

  tick(t, dt) {
    this.el.object3D.getWorldPosition(this.worldPosition);

    if (!almostEquals(0.005, this.worldPosition, this.lastPosition)) {
      this.direction.subVectors(this.worldPosition, this.lastPosition).normalize();
      this.lastPosition.copy(this.worldPosition);
    }

    if (this.currentDrawing) {
      const time = this.timeSinceLastDraw + dt;
      if (
        time >= this.data.drawFrequency &&
        this.currentDrawing.getLastPoint().distanceTo(this.worldPosition) >= this.data.minDistanceBetweenPoints
      ) {
        this.getNormal(this.normal, this.worldPosition, this.direction);
        this.currentDrawing.draw(this.worldPosition, this.direction, this.normal);
      }

      this.timeSinceLastDraw = time % this.data.drawFrequency;
    }
  },

  //helper function to get normal of direction of drawing cross direction to camera
  getNormal: (() => {
    const directionToCamera = new THREE.Vector3();
    return function(normal, position, direction) {
      directionToCamera.subVectors(position, this.data.camera.object3D.position).normalize();
      normal.crossVectors(direction, directionToCamera);
    };
  })(),

  startDraw() {
    this.currentDrawing = this.drawingManager.getDrawing(this);
    if (this.currentDrawing) {
      this.el.object3D.getWorldPosition(this.worldPosition);
      this.getNormal(this.normal, this.worldPosition, this.direction);

      this.currentDrawing.startDraw(this.worldPosition, this.direction, this.normal, this.el.getAttribute("color"));
    }
  },

  endDraw() {
    if (this.currentDrawing) {
      this.timeSinceLastDraw = 0;
      this.el.object3D.getWorldPosition(this.worldPosition);
      this.getNormal(this.normal, this.worldPosition, this.direction);
      this.currentDrawing.endDraw(this.worldPosition, this.direction, this.normal);
      this.drawingManager.returnDrawing(this);
      this.currentDrawing = null;
    }
  },

  changeColor(mod) {
    this.colorIndex = (this.colorIndex + mod + this.data.availableColors.length) % this.data.availableColors.length;
    const color = this.data.availableColors[this.colorIndex];
    this.el.setAttribute("color", color);
  },

  stateAdded(evt) {
    switch (evt.detail) {
      case "activated":
        this.startDraw();
        break;
      case "colorNext":
        this.changeColor(1);
        break;
      case "colorPrev":
        this.changeColor(-1);
        break;
      case "grabbed":
        this.grabbed = true;
        break;
      default:
        break;
    }
  },

  stateRemoved(evt) {
    switch (evt.detail) {
      case "activated":
        this.endDraw();
        break;
      case "grabbed":
        this.grabbed = false;
        this.endDraw();
        break;
      default:
        break;
    }
  },

  onComponentChanged(evt) {
    if (evt.detail.name === "color") {
      this.changeColor(0);
    }
  },

  onMouseWheel(e) {
    if (this.grabbed) this.changeColor(e.deltaY > 0 ? 1 : -1);
  }
});
