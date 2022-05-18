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
    far: { default: 100 },
    near: { default: 0.01 },
    defaultDistance: { default: 4 },
    minDistance: { default: 0.18 }
  },

  init: function() {
    this.enabled = false;

    this.cursorVisual = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(),
      new THREE.ShaderMaterial({
        depthTest: false,
        uniforms: {
          color: { value: new THREE.Color(0x2f80ed) }
        },
        vertexShader: `
          varying vec2 vPos;
          void main() {
            vPos = position.xy;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );

            vec2 scale = vec2(
              length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) ),
              length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) )
            );

            float distance = -mvPosition.z;
            scale *= distance; // negates projection scale
            scale += min(1.0/distance, 0.3); // scale in screen space

            float radius = 0.02;
            mvPosition.xy += position.xy * radius * scale;
            gl_Position = projectionMatrix * mvPosition;
          }`,
        fragmentShader: `
          uniform vec3 color;
          varying vec2 vPos;

          void main() {
            float distance = length(vPos);
            if (distance > 0.5) {
                discard;
            }

            gl_FragColor = vec4(
              mix(color, vec3(0.0), step(0.35, distance)),
              0.8
            );

            // #include <tonemapping_fragment>
            #include <encodings_fragment>
          }`
      })
    );

    const setCursorScale = () => {
      this.cursorVisual.scale.setScalar(APP.store.state.preferences["cursorSize"] || 1);
      this.cursorVisual.matrixNeedsUpdate = true;
    };
    APP.store.addEventListener("statechanged", setCursorScale);
    setCursorScale();

    this.cursorVisual.renderOrder = window.APP.RENDER_ORDER.CURSOR;
    this.cursorVisual.material.transparent = true;
    this.data.cursor.object3D.add(this.cursorVisual);

    this.intersection = null;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.firstHitOnly = true; // flag specific to three-mesh-bvh
    this.distance = this.data.far;
    this.color = this.cursorVisual.material.uniforms.color.value;

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(2 * 3), 3));

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
    const v = new THREE.Vector3();

    return function(t, left) {
      const userinput = AFRAME.scenes[0].systems.userinput;
      const cursorPose = userinput.get(left ? paths.actions.cursor.left.pose : paths.actions.cursor.right.pose);
      const hideLine = userinput.get(left ? paths.actions.cursor.left.hideLine : paths.actions.cursor.right.hideLine);

      this.data.cursor.object3D.visible = this.enabled && !!cursorPose;
      this.line.material.visible = !!(this.enabled && !hideLine);

      this.intersection = null;

      if (!this.enabled || !cursorPose) {
        return;
      }

      this.el.sceneEl.systems["hubs-systems"].characterController.avatarPOV.object3D.updateMatrices();
      const playerScale = v
        .setFromMatrixColumn(
          this.el.sceneEl.systems["hubs-systems"].characterController.avatarPOV.object3D.matrixWorld,
          1
        )
        .length();
      this.raycaster.far = this.data.far * playerScale;
      this.raycaster.near = this.data.near * playerScale;

      const interaction = AFRAME.scenes[0].systems.interaction;
      const isGrabbing = left ? !!interaction.state.leftRemote.held : !!interaction.state.rightRemote.held;
      if (!isGrabbing) {
        rawIntersections.length = 0;
        this.raycaster.ray.origin = cursorPose.position;
        this.raycaster.ray.direction = cursorPose.direction;
        this.raycaster.intersectObjects(
          AFRAME.scenes[0].systems["hubs-systems"].cursorTargettingSystem.targets,
          true,
          rawIntersections
        );
        this.intersection = rawIntersections[0];
        this.intersectionIsValid = !!interaction.updateCursorIntersection(this.intersection, left);
        this.distance = this.intersectionIsValid ? this.intersection.distance : this.data.defaultDistance * playerScale;
      }

      const { cursor, minDistance, far, camera } = this.data;

      const cursorModDelta =
        userinput.get(left ? paths.actions.cursor.left.modDelta : paths.actions.cursor.right.modDelta) || 0;
      if (isGrabbing && !userinput.activeSets.includes(left ? sets.leftCursorHoldingUI : sets.rightCursorHoldingUI)) {
        this.distance = THREE.Math.clamp(this.distance - cursorModDelta, minDistance, far * playerScale);
      }
      cursor.object3D.position.copy(cursorPose.position).addScaledVector(cursorPose.direction, this.distance);
      // The cursor will always be oriented towards the player about its Y axis, so objects held by the cursor will rotate towards the player.
      getLastWorldPosition(camera.object3D, cameraPos);
      cameraPos.y = cursor.object3D.position.y;
      cursor.object3D.lookAt(cameraPos);
      cursor.object3D.matrixNeedsUpdate = true;

      // TODO : Check if the selected object being transformed is for this cursor!
      const transformObjectSystem = AFRAME.scenes[0].systems["transform-selected-object"];
      if (
        transformObjectSystem.transforming &&
        ((left && transformObjectSystem.hand.el.id === "player-left-controller") ||
          (!left && transformObjectSystem.hand.el.id === "player-right-controller"))
      ) {
        this.color.copy(TRANSFORM_COLOR_1).lerpHSL(TRANSFORM_COLOR_2, 0.5 + 0.5 * Math.sin(t / 1000.0));
      } else if (this.intersectionIsValid || isGrabbing) {
        this.color.copy(HIGHLIGHT);
      } else {
        this.color.copy(NO_HIGHLIGHT);
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
