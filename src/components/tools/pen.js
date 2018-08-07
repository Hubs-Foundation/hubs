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
    minDistanceBetweenPoints: { default: 0.4 },
    defaultDirection: { default: { x: 1, y: 0, z: 0 } },
    camera: { type: "selector" },
    drawing: { type: "string" },
    drawingManager: { type: "string" }
  },

  init() {
    this.startDraw = this.startDraw.bind(this);
    this.endDraw = this.endDraw.bind(this);

    this.timeSinceLastDraw = 0;

    this.lastPosition = new THREE.Vector3();
    this.lastPosition.copy(this.el.object3D.position);

    this.direction = new THREE.Vector3();
    this.direction.copy(this.data.defaultDirection);

    this.currentDrawing = null;

    this.normal = new THREE.Vector3();

    this.worldPosition = new THREE.Vector3();
  },

  play() {
    this.drawingManager = document.querySelector(this.data.drawingManager).components["drawing-manager"];

    this.el.parentNode.addEventListener("activate-start", this.startDraw);
    this.el.parentNode.addEventListener("activate-end", this.endDraw);
  },

  pause() {
    this.el.parentNode.removeEventListener("activate-start", this.startDraw);
    this.el.parentNode.removeEventListener("activate-end", this.endDraw);
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
    // const worldQuaternion = new THREE.Quaternion();
    return function(normal, position, direction) {
      // if (this.data.camera) {
      directionToCamera.subVectors(position, this.data.camera.object3D.position).normalize();
      normal.crossVectors(direction, directionToCamera);
      // normal.set(normal.x, Math.abs(normal.y), normal.z);
      // console.log(normal);
      // } else {
      //TODO remove?
      // this.el.object3D.getWorldQuaternion(worldQuaternion);
      // normal
      //   .copy(this.el.object3D.up)
      //   .applyQuaternion(worldQuaternion)
      //   .normalize();
      // }
    };
  })(),

  startDraw() {
    this.currentDrawing = this.drawingManager.getDrawing(this);
    if (this.currentDrawing) {
      this.el.object3D.getWorldPosition(this.worldPosition);
      this.getNormal(this.normal, this.worldPosition, this.direction);
      const color =
        "#" +
        Math.random()
          .toString(16)
          .slice(2, 8);
      this.el.setAttribute("material", { color: color });
      this.currentDrawing.startDraw(this.worldPosition, this.direction, this.normal, color);
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
  }
});
