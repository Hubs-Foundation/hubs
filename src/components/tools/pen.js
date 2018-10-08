import { paths } from "../../systems/userinput/paths";
import { sets } from "../../systems/userinput/sets";

const pathsMap = {
  "player-right-controller": {
    startDrawing: paths.actions.rightHand.startDrawing,
    stopDrawing: paths.actions.rightHand.stopDrawing,
    penNextColor: paths.actions.rightHand.penNextColor,
    penPrevColor: paths.actions.rightHand.penPrevColor,
    scalePenTip: paths.actions.rightHand.scalePenTip
  },
  "player-left-controller": {
    startDrawing: paths.actions.leftHand.startDrawing,
    stopDrawing: paths.actions.leftHand.stopDrawing,
    penNextColor: paths.actions.leftHand.penNextColor,
    penPrevColor: paths.actions.leftHand.penPrevColor,
    scalePenTip: paths.actions.leftHand.scalePenTip
  },
  cursor: {
    startDrawing: paths.actions.cursor.startDrawing,
    stopDrawing: paths.actions.cursor.stopDrawing,
    penNextColor: paths.actions.cursor.penNextColor,
    penPrevColor: paths.actions.cursor.penPrevColor,
    scalePenTip: paths.actions.cursor.scalePenTip
  }
};
/**
 * Pen tool
 * A tool that allows drawing on networked-drawing components.
 * @namespace drawing
 * @component pen
 */

function almostEquals(epsilon, u, v) {
  return Math.abs(u.x - v.x) < epsilon && Math.abs(u.y - v.y) < epsilon && Math.abs(u.z - v.z) < epsilon;
}

AFRAME.registerComponent("pen", {
  schema: {
    drawFrequency: { default: 5 }, //frequency of polling for drawing points
    minDistanceBetweenPoints: { default: 0.01 }, //minimum distance to register new drawing point
    camera: { type: "selector" },
    drawingManager: { type: "string" },
    color: { type: "color", default: "#FF0033" },
    availableColors: {
      default: [
        "#FF0033",
        "#FFFF00",
        "#0099FF",
        "#00FF33",
        "#9900FF",
        "#FF6600",
        "#8D5524",
        "#C68642",
        "#E0AC69",
        "#F1C27D",
        "#FFDBAC",
        "#FFFFFF",
        "#222222",
        "#111111",
        "#000000"
      ]
    },
    radius: { default: 0.01 }, //drawing geometry radius
    minRadius: { default: 0.005 },
    maxRadius: { default: 0.2 },
    startDrawingPath: { default: undefined },
    stopDrawingPath: { default: undefined },
    changePenSizePath: { default: undefined },
    nextColorPath: { default: undefined },
    prevColorPath: { default: undefined }
  },

  init() {
    this._stateAdded = this._stateAdded.bind(this);
    this._stateRemoved = this._stateRemoved.bind(this);

    this.timeSinceLastDraw = 0;

    this.lastPosition = new THREE.Vector3();
    this.lastPosition.copy(this.el.object3D.position);

    this.direction = new THREE.Vector3(1, 0, 0);

    this.currentDrawing = null;

    this.normal = new THREE.Vector3();

    this.worldPosition = new THREE.Vector3();

    this.colorIndex = 0;

    this.grabbed = false;
    this.actionPath = null;
  },

  play() {
    this.drawingManager = document.querySelector(this.data.drawingManager).components["drawing-manager"];
    this.drawingManager.createDrawing();

    this.el.parentNode.addEventListener("stateadded", this._stateAdded);
    this.el.parentNode.addEventListener("stateremoved", this._stateRemoved);
  },

  pause() {
    this.el.parentNode.removeEventListener("stateadded", this._stateAdded);
    this.el.parentNode.removeEventListener("stateremoved", this._stateRemoved);
  },

  update(prevData) {
    if (prevData.color != this.data.color) {
      this.el.setAttribute("color", this.data.color);
    }
    if (prevData.radius != this.data.radius) {
      this.el.setAttribute("radius", this.data.radius);
    }
  },

  tick(t, dt) {
    const grabber = this.el.parentNode.components.grabbable.grabbers[0];
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (grabber && pathsMap.has(grabber.id)) {
      const paths = pathsMap[grabber.id];
      if (userinput.readFrameValueAtPath(paths.startDrawing)) {
        this._startDraw();
      }
      if (userinput.readFrameValueAtPath(paths.stopDrawing)) {
        this._endDraw();
      }
      const penScaleMod = userinput.readFrameValueAtPath(paths.scalePenTip);
      if (penScaleMod) {
        this._changeRadius(penScaleMod);
      }
      if (userinput.readFrameValueAtPath(paths.penNextColor)) {
        this._changeColor(1);
      }
      if (userinput.readFrameValueAtPath(paths.penPrevColor)) {
        this._changeColor(-1);
      }
    }

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
        this._getNormal(this.normal, this.worldPosition, this.direction);
        this.currentDrawing.draw(this.worldPosition, this.direction, this.normal, this.data.color, this.data.radius);
      }

      this.timeSinceLastDraw = time % this.data.drawFrequency;
    }
  },

  //helper function to get normal of direction of drawing cross direction to camera
  _getNormal: (() => {
    const directionToCamera = new THREE.Vector3();
    return function(normal, position, direction) {
      directionToCamera.subVectors(position, this.data.camera.object3D.position).normalize();
      normal.crossVectors(direction, directionToCamera);
    };
  })(),

  _startDraw() {
    this.currentDrawing = this.drawingManager.getDrawing(this);
    if (this.currentDrawing) {
      this.el.object3D.getWorldPosition(this.worldPosition);
      this._getNormal(this.normal, this.worldPosition, this.direction);

      this.currentDrawing.startDraw(this.worldPosition, this.direction, this.normal, this.data.color, this.data.radius);
    }
  },

  _endDraw() {
    if (this.currentDrawing) {
      this.timeSinceLastDraw = 0;
      this.el.object3D.getWorldPosition(this.worldPosition);
      this._getNormal(this.normal, this.worldPosition, this.direction);
      this.currentDrawing.endDraw(this.worldPosition, this.direction, this.normal);
      this.drawingManager.returnDrawing(this);
      this.currentDrawing = null;
    }
  },

  _changeColor(mod) {
    this.colorIndex = (this.colorIndex + mod + this.data.availableColors.length) % this.data.availableColors.length;
    this.data.color = this.data.availableColors[this.colorIndex];
    this.el.setAttribute("color", this.data.color);
  },

  _changeRadius(mod) {
    this.data.radius = Math.max(this.data.minRadius, Math.min(this.data.radius + mod, this.data.maxRadius));
    this.el.setAttribute("radius", this.data.radius);
  }
});
