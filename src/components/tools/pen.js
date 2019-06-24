import { paths } from "../../systems/userinput/paths";
import { getLastWorldPosition, getLastWorldQuaternion } from "../../utils/three-utils";
import {
  SOUND_PEN_START_DRAW,
  SOUND_PEN_STOP_DRAW,
  SOUND_PEN_UNDO_DRAW,
  SOUND_PEN_CHANGE_COLOR
} from "../../systems/sound-effects-system";
import { waitForDOMContentLoaded } from "../../utils/async-utils";
import MobileStandardMaterial from "../../materials/MobileStandardMaterial";

const pathsMap = {
  "player-right-controller": {
    startDrawing: paths.actions.rightHand.startDrawing,
    stopDrawing: paths.actions.rightHand.stopDrawing,
    undoDrawing: paths.actions.rightHand.undoDrawing,
    switchDrawMode: paths.actions.rightHand.switchDrawMode,
    penNextColor: paths.actions.rightHand.penNextColor,
    penPrevColor: paths.actions.rightHand.penPrevColor,
    scalePenTip: paths.actions.rightHand.scalePenTip
  },
  "player-left-controller": {
    startDrawing: paths.actions.leftHand.startDrawing,
    stopDrawing: paths.actions.leftHand.stopDrawing,
    undoDrawing: paths.actions.leftHand.undoDrawing,
    switchDrawMode: paths.actions.leftHand.switchDrawMode,
    penNextColor: paths.actions.leftHand.penNextColor,
    penPrevColor: paths.actions.leftHand.penPrevColor,
    scalePenTip: paths.actions.leftHand.scalePenTip
  },
  cursor: {
    pose: paths.actions.cursor.pose,
    startDrawing: paths.actions.cursor.startDrawing,
    stopDrawing: paths.actions.cursor.stopDrawing,
    undoDrawing: paths.actions.cursor.undoDrawing,
    penNextColor: paths.actions.cursor.penNextColor,
    penPrevColor: paths.actions.cursor.penPrevColor,
    scalePenTip: paths.actions.cursor.scalePenTip
  }
};

const DRAW_MODE = {
  DEFAULT_2D: 0,
  PROJECTION: 1
};

const MAX_DISTANCE_BETWEEN_SURFACES = 1;

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
    far: { default: 100 },
    near: { default: 0.01 }
  },

  init() {
    this.timeSinceLastDraw = 0;

    this.lastPosition = new THREE.Vector3();
    this.lastPosition.copy(this.el.object3D.position);

    this.direction = new THREE.Vector3(1, 0, 0);

    this.currentDrawing = null;

    this.normal = new THREE.Vector3();

    this.worldPosition = new THREE.Vector3();

    this.colorIndex = 0;

    this.grabbed = false;

    this.raycaster = new THREE.Raycaster();
    this.raycaster.firstHitOnly = true; // flag specific to three-mesh-bvh

    this.originalPosition = this.el.object3D.position.clone();
    this.intersection = null;
    this.lastIntersectionDistance = 0;

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(2 * 3), 3));

    this.line = new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({
        color: "red",
        opacity: 0.2,
        transparent: true,
        visible: true
      })
    );

    //prevents the line from being a raycast target for the cursor
    this.line.raycast = function() {};

    this.el.parentEl.setObject3D("penline", this.line);

    this.drawMode = DRAW_MODE.DEFAULT_2D;

    this.targets = [];
    this.setDirty = this.setDirty.bind(this);
    this.dirty = true;

    let material = new THREE.MeshStandardMaterial();
    if (window.APP && window.APP.quality === "low") {
      material = MobileStandardMaterial.fromStandardMaterial(material);
    }
    this.penTip = new THREE.Mesh(new THREE.SphereBufferGeometry(1, 16, 12), material);
    this.penTip.scale.setScalar(this.data.radius / this.el.parentEl.object3D.scale.x);
    this.penTip.matrixNeedsUpdate = true;

    this.el.setObject3D("mesh", this.penTip);

    const environmentMapComponent = this.el.sceneEl.components["environment-map"];
    if (environmentMapComponent) {
      environmentMapComponent.applyEnvironmentMap(this.el.parentEl.object3D);
    }

    // TODO: Use the MutationRecords passed into the callback function to determine added/removed nodes!
    this.observer = new MutationObserver(this.setDirty);

    waitForDOMContentLoaded().then(() => {
      const scene = document.querySelector("a-scene");
      this.rightRemote = document.querySelector("#cursor-controller");
      this.observer.observe(scene, { childList: true, attributes: true, subtree: true });
      scene.addEventListener("object3dset", this.setDirty);
      scene.addEventListener("object3dremove", this.setDirty);
    });
  },

  play() {
    this.drawingManager = document.querySelector(this.data.drawingManager).components["drawing-manager"];
    this.drawingManager.createDrawing();
  },

  update(prevData) {
    if (prevData.color != this.data.color) {
      this.penTip.material.color.set(this.data.color);
      this.line.material.color.set(this.data.color);
    }
    if (prevData.radius != this.data.radius) {
      this.el.setAttribute("radius", this.data.radius);
    }

    this.raycaster.far = this.data.far;
    this.raycaster.near = this.data.near;
  },

  tick: (() => {
    const rawIntersections = [];
    const lineStartPosition = new THREE.Vector3();
    const lineEndPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    return function(t, dt) {
      const userinput = AFRAME.scenes[0].systems.userinput;
      const interaction = AFRAME.scenes[0].systems.interaction;

      if (interaction.state.rightHand.held === this.el.parentNode) {
        this.grabberId = "player-right-controller";
      } else if (interaction.state.leftHand.held === this.el.parentNode) {
        this.grabberId = "player-left-controller";
      } else if (interaction.state.rightRemote.held === this.el.parentNode) {
        this.grabberId = "cursor";
        this.drawMode = DRAW_MODE.PROJECTION;
      } else {
        this.grabberId = null;
      }

      if (this.grabberId && pathsMap[this.grabberId]) {
        const sfx = this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem;
        const paths = pathsMap[this.grabberId];
        if (userinput.get(paths.startDrawing)) {
          this._startDraw();
          sfx.playSoundOneShot(SOUND_PEN_START_DRAW);
        }
        if (userinput.get(paths.stopDrawing)) {
          this._endDraw();
          sfx.playSoundOneShot(SOUND_PEN_STOP_DRAW);
        }
        const penScaleMod = userinput.get(paths.scalePenTip);
        if (penScaleMod) {
          this._changeRadius(penScaleMod);
        }
        if (userinput.get(paths.penNextColor)) {
          this._changeColor(1);
          sfx.playSoundOneShot(SOUND_PEN_CHANGE_COLOR);
        }
        if (userinput.get(paths.penPrevColor)) {
          this._changeColor(-1);
          sfx.playSoundOneShot(SOUND_PEN_CHANGE_COLOR);
        }
        if (userinput.get(paths.undoDrawing)) {
          this._undoDraw();
          sfx.playSoundOneShot(SOUND_PEN_UNDO_DRAW);
        }
        if (paths.switchDrawMode && userinput.get(paths.switchDrawMode)) {
          this.drawMode = this.drawMode === DRAW_MODE.DEFAULT_2D ? DRAW_MODE.PROJECTION : DRAW_MODE.DEFAULT_2D;
        }
      }

      rawIntersections.length = 0;

      this.intersection = null;
      let cursorPose;
      if (this.drawMode === DRAW_MODE.PROJECTION) {
        if (this.grabberId === "cursor") {
          cursorPose = userinput.get(pathsMap.cursor.pose);
          if (cursorPose) {
            this.raycaster.ray.origin.copy(cursorPose.position);
            this.raycaster.ray.direction.copy(cursorPose.direction);
          }
        } else if (this.grabberId !== null) {
          getLastWorldPosition(this.el.parentEl.object3D, this.raycaster.ray.origin);
          getLastWorldQuaternion(this.el.parentEl.object3D, worldQuaternion);
          this.raycaster.ray.direction.set(0, -1, 0);
          this.raycaster.ray.direction.applyQuaternion(worldQuaternion);
        }

        if (this.grabberId !== null) {
          this.raycaster.intersectObjects(this.targets, true, rawIntersections);
          this.intersection = rawIntersections[0];

          if (this.intersection) {
            if (cursorPose) {
              lineStartPosition.copy(cursorPose.position);
              this.el.parentEl.object3D.worldToLocal(lineStartPosition);
            } else {
              lineStartPosition.set(0, 0, 0);
            }
            lineEndPosition.copy(this.intersection.point);
            this.el.parentEl.object3D.worldToLocal(lineEndPosition);

            const positionArray = this.line.geometry.attributes.position.array;
            positionArray[0] = lineStartPosition.x;
            positionArray[1] = lineStartPosition.y;
            positionArray[2] = lineStartPosition.z;
            positionArray[3] = lineEndPosition.x;
            positionArray[4] = lineEndPosition.y;
            positionArray[5] = lineEndPosition.z;

            this.line.geometry.attributes.position.needsUpdate = true;
          }

          if (this.intersection) {
            this.el.object3D.position.copy(this.intersection.point);

            this.el.parentEl.object3D.worldToLocal(this.el.object3D.position);

            this.el.object3D.matrixNeedsUpdate = true;
            this.worldPosition.copy(this.intersection.point);
          } else {
            this.el.object3D.position.copy(this.originalPosition);
            this.el.object3D.matrixNeedsUpdate = true;
            getLastWorldPosition(this.el.object3D, this.worldPosition);
          }
        }
      } else {
        this.el.object3D.position.copy(this.originalPosition);
        this.el.object3D.matrixNeedsUpdate = true;
        getLastWorldPosition(this.el.object3D, this.worldPosition);
      }

      this._setPenVisible(this.grabberId !== "cursor" || !this.intersection);
      this._setLineVisible(
        this.el.sceneEl.is("vr-mode") && this.drawMode === DRAW_MODE.PROJECTION && this.intersection
      );

      //Prevent drawings from "jumping" large distances
      if (
        this.currentDrawing &&
        (this.lastIntersectedObject !== (this.intersection ? this.intersection.object : null) &&
          (!this.intersection ||
            Math.abs(this.intersection.distance - this.lastIntersectionDistance) > MAX_DISTANCE_BETWEEN_SURFACES))
      ) {
        this.worldPosition.copy(this.lastPosition);
        this._endDraw();
      }
      this.lastIntersectionDistance = this.intersection ? this.intersection.distance : 0;
      this.lastIntersectedObject = this.intersection ? this.intersection.object : null;

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

      if (this.currentDrawing && !this.grabberId) {
        this._endDraw();
      }

      if (this.dirty) {
        this.populateEntities(this.targets);
        this.dirty = false;
      }

      this.el.object3D.matrixNeedsUpdate = true;
    };
  })(),

  _setPenVisible(visible) {
    if (this.el.parentEl.object3DMap.mesh && this.el.parentEl.object3DMap.mesh.visible !== visible) {
      this.el.parentEl.object3DMap.mesh.visible = visible;
    }
  },

  _setLineVisible(visible) {
    if (this.line.material.visible !== visible) {
      this.line.material.visible = visible;
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
      this._getNormal(this.normal, this.worldPosition, this.direction);
      this.currentDrawing.startDraw(this.worldPosition, this.direction, this.normal, this.data.color, this.data.radius);
    }
  },

  _endDraw() {
    if (this.currentDrawing) {
      this.timeSinceLastDraw = 0;
      this._getNormal(this.normal, this.worldPosition, this.direction);
      this.currentDrawing.endDraw(this.worldPosition, this.direction, this.normal);
      this.drawingManager.returnDrawing(this);
      this.currentDrawing = null;
    }
  },

  _undoDraw() {
    const drawing = this.drawingManager.getDrawing(this);
    if (drawing) {
      drawing.undoDraw();
      this.drawingManager.returnDrawing(this);
    }
  },

  _changeColor(mod) {
    this.colorIndex = (this.colorIndex + mod + this.data.availableColors.length) % this.data.availableColors.length;
    this.data.color = this.data.availableColors[this.colorIndex];
    this.penTip.material.color.set(this.data.color);
    this.line.material.color.set(this.data.color);
  },

  _changeRadius(mod) {
    this.data.radius = Math.max(this.data.minRadius, Math.min(this.data.radius + mod, this.data.maxRadius));
    this.penTip.scale.setScalar(this.data.radius / this.el.parentEl.object3D.scale.x);
    this.penTip.matrixNeedsUpdate = true;
  },

  setDirty() {
    this.dirty = true;
  },

  populateEntities(targets) {
    targets.length = 0;
    // TODO: Do not querySelectorAll on the entire scene every time anything changes!
    const els = AFRAME.scenes[0].querySelectorAll(".collidable, .interactable, #environment-root");
    for (let i = 0; i < els.length; i++) {
      if (!els[i].classList.contains("pen") && els[i].object3D) {
        targets.push(els[i].object3D);
      }
    }
  },

  remove() {
    this.observer.disconnect();
    AFRAME.scenes[0].removeEventListener("object3dset", this.setDirty);
    AFRAME.scenes[0].removeEventListener("object3dremove", this.setDirty);
    this.el.parentEl.removeObject3D("penline");
  }
});
