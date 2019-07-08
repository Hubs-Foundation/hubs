import { paths } from "../systems/userinput/paths";
import { sets } from "../systems/userinput/sets";
import { getLastWorldPosition } from "../utils/three-utils";

const HIGHLIGHT = new THREE.Color(23 / 255, 64 / 255, 118 / 255);
const NO_HIGHLIGHT = new THREE.Color(190 / 255, 190 / 255, 190 / 255);
const TRANSFORM_COLOR_1 = new THREE.Color(150 / 255, 80 / 255, 150 / 255);
const TRANSFORM_COLOR_2 = new THREE.Color(23 / 255, 64 / 255, 118 / 255);
AFRAME.registerComponent("cursor-controller", {
  schema: {
    cursor: { type: "selector" },
    camera: { type: "selector" },
    far: { default: 25 },
    near: { default: 0.01 },
    defaultDistance: { default: 4 },
    minDistance: { default: 0.18 }
  },

  init: function() {
    this.enabled = true;

    this.data.cursor.addEventListener(
      "loaded",
      () => {
        this.data.cursor.object3DMap.mesh.renderOrder = window.APP.RENDER_ORDER.CURSOR;
      },
      { once: true }
    );

    this.raycaster = new THREE.Raycaster();
    this.raycaster.firstHitOnly = true; // flag specific to three-mesh-bvh
    this.distance = this.data.far;
    this.color = new THREE.Color(0, 0, 0);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(2 * 3), 3));

    this.line = new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({
        color: "white",
        opacity: 0.2,
        transparent: true,
        visible: false
      })
    );
    this.el.setObject3D("line", this.line);
  },

  update: function() {
    this.raycaster.far = this.data.far;
    this.raycaster.near = this.data.near;
  },

  tick2: (() => {
    const rawIntersections = [];
    const cameraPos = new THREE.Vector3();

    return function(t) {
      const userinput = AFRAME.scenes[0].systems.userinput;
      const cursorPose = userinput.get(paths.actions.cursor.pose);
      const hideLine = userinput.get(paths.actions.cursor.hideLine);

      this.data.cursor.object3D.visible = this.enabled && !!cursorPose;
      this.line.material.visible = !!(this.enabled && !hideLine);

      if (!this.enabled || !cursorPose) {
        return;
      }

      const interaction = AFRAME.scenes[0].systems.interaction;
      let intersection;
      const isGrabbing = !!interaction.state.rightRemote.held;
      if (!isGrabbing) {
        rawIntersections.length = 0;
        this.raycaster.ray.origin = cursorPose.position;
        this.raycaster.ray.direction = cursorPose.direction;
        this.raycaster.intersectObjects(
          AFRAME.scenes[0].systems["hubs-systems"].cursorTargettingSystem.targets,
          true,
          rawIntersections
        );
        intersection = rawIntersections[0];
        interaction.updateCursorIntersection(intersection);
        this.distance = intersection ? intersection.distance : this.data.defaultDistance;
      }

      const { cursor, minDistance, far, camera } = this.data;

      const cursorModDelta = userinput.get(paths.actions.cursor.modDelta) || 0;
      if (isGrabbing && !userinput.activeSets.includes(sets.cursorHoldingUI)) {
        this.distance = THREE.Math.clamp(this.distance - cursorModDelta, minDistance, far);
      }
      cursor.object3D.position.copy(cursorPose.position).addScaledVector(cursorPose.direction, this.distance);
      // The cursor will always be oriented towards the player about its Y axis, so objects held by the cursor will rotate towards the player.
      getLastWorldPosition(camera.object3D, cameraPos);
      cameraPos.y = cursor.object3D.position.y;
      cursor.object3D.lookAt(cameraPos);
      cursor.object3D.scale.setScalar(Math.pow(this.distance, 0.315) * 0.75);
      cursor.object3D.matrixNeedsUpdate = true;

      if (AFRAME.scenes[0].systems["transform-selected-object"].transforming) {
        this.color.copy(TRANSFORM_COLOR_1).lerpHSL(TRANSFORM_COLOR_2, 0.5 + 0.5 * Math.sin(t / 1000.0));
      } else if (intersection || isGrabbing) {
        this.color.copy(HIGHLIGHT);
      } else {
        this.color.copy(NO_HIGHLIGHT);
      }

      if (!this.data.cursor.object3DMap.mesh.material.color.equals(this.color)) {
        this.data.cursor.object3DMap.mesh.material.color.copy(this.color);
        this.data.cursor.object3DMap.mesh.material.needsUpdate = true;
      }

      if (this.line.material.visible) {
        const posePosition = cursorPose.position;
        const cursorPosition = cursor.object3D.position;
        const positionArray = this.line.geometry.attributes.position.array;

        positionArray[0] = posePosition.x;
        positionArray[1] = posePosition.y;
        positionArray[2] = posePosition.z;
        positionArray[3] = cursorPosition.x;
        positionArray[4] = cursorPosition.y;
        positionArray[5] = cursorPosition.z;

        this.line.geometry.attributes.position.needsUpdate = true;
        this.line.geometry.computeBoundingSphere();
      }
    };
  })()
});
