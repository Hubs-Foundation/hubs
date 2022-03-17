import { MediaType } from "../utils/media-utils";
import { applyPersistentSync } from "../utils/permissions-utils";
import { cloneObject3D, disposeNode } from "../utils/three-utils";
import qsTruthy from "../utils/qs_truthy";

function scaleForAspectFit(containerSize, itemSize) {
  return Math.min(containerSize.x / itemSize.x, containerSize.y / itemSize.y, containerSize.z / itemSize.z);
}

const DEBUG = qsTruthy("debug");

const isCapturableByType = {
  [MediaType.ALL]: function(el) {
    return !!(el && el.components["media-loader"]);
  },
  [MediaType.ALL_2D]: function(el) {
    return !!(el && (el.components["media-image"] || el.components["media-video"] || el.components["media-pdf"]));
  },
  [MediaType.MODEL]: function(el) {
    return !!(el && el.components["gltf-model-plus"]);
  },
  [MediaType.IMAGE]: function(el) {
    return !!(el && el.components["media-image"]);
  },
  [MediaType.VIDEO]: function(el) {
    return !!(el && el.components["media-video"]);
  },
  [MediaType.PDF]: function(el) {
    return !!(el && el.components["media-pdf"]);
  }
};

const EMPTY_COLOR = 0x6fc0fd;
const HOVER_COLOR = 0x2f80ed;
const FULL_COLOR = 0x808080;

const components = [];
export class MediaFramesSystem {
  constructor(physicsSystem, interactionSystem) {
    this.physicsSystem = physicsSystem;
    this.interactionSystem = interactionSystem;
  }

  tick() {
    for (let i = 0; i < components.length; i++) {
      const frame = components[i];

      const bodyUUID = frame.el.components["body-helper"].uuid;
      // TODO would be nice to fix the timing so we don't need to check this
      if (!this.physicsSystem.bodyInitialized(bodyUUID)) continue;

      const holdingSomethingCapturable = this.interactionSystem.isHoldingAnything(
        isCapturableByType[frame.data.mediaType]
      );

      const guideMesh = frame.el.getObject3D("guide");
      guideMesh.visible = holdingSomethingCapturable;

      if (frame.data.targetId === "empty") {
        // frame empty
        guideMesh.material.uniforms.color.value.set(EMPTY_COLOR);
        const capturableEl = this.getCapturableEntityCollidingWithBody(frame.data.mediaType, bodyUUID);
        if (capturableEl && NAF.utils.isMine(capturableEl)) {
          // capturable object I own is colliding with an empty frame
          if (this.interactionSystem.isHeld(capturableEl)) {
            // held object I own colliding with an empty frame, show preview
            guideMesh.material.uniforms.color.value.set(HOVER_COLOR);
            frame.showPreview(capturableEl);
          } else {
            // non-held object I own colliding with an empty frame, capture
            frame.capture(capturableEl);
          }
        } else {
          // no capturable object I own is colliding with this empty frame, hide preview
          frame.hidePreview();
        }
      } else {
        // frame full
        guideMesh.material.uniforms.color.value.set(FULL_COLOR);
        frame.hidePreview();
        const capturedEl = document.getElementById(frame.data.targetId);
        if (capturedEl) {
          if (NAF.utils.isMine(capturedEl)) {
            if (this.interactionSystem.isHeld(capturedEl)) {
              if (!this.isColliding(frame.el, capturedEl)) {
                // holding the captured object and its no longer colliding, releasee it
                frame.release();
              } else {
                // holding within bounds
                guideMesh.material.uniforms.color.value.set(HOVER_COLOR);
              }
            } else if (frame.data.snapToCenter && this.interactionSystem.wasReleasedThisFrame(capturedEl)) {
              // released in bounds, re-snap
              frame.snapObject(capturedEl);
            }
          }
        } else {
          // captured object was removed
          frame.release();
        }
      }
    }
  }

  getCapturableEntityCollidingWithBody(mediaType, bodyUUID) {
    const collisions = this.physicsSystem.getCollisions(bodyUUID);
    for (let i = 0; i < collisions.length; i++) {
      const bodyData = this.physicsSystem.bodyUuidToData.get(collisions[i]);
      const mediaObjectEl = bodyData && bodyData.object3D && bodyData.object3D.el;
      if (isCapturableByType[mediaType](mediaObjectEl)) {
        return mediaObjectEl;
      }
    }
    return null;
  }

  isColliding(entityA, entityB) {
    const bodyAUUID = entityA.components["body-helper"].uuid;
    const bodyBUUID = entityB.components["body-helper"].uuid;
    return (
      this.physicsSystem.bodyInitialized(bodyAUUID) &&
      this.physicsSystem.bodyInitialized(bodyBUUID) &&
      this.physicsSystem.getCollisions(bodyAUUID).indexOf(bodyBUUID) !== -1
    );
  }
}

AFRAME.registerComponent("media-frame", {
  schema: {
    bounds: { default: new THREE.Vector3(1, 1, 1) },
    mediaType: { default: MediaType.ALL_2D, oneOf: Object.values(MediaType) },
    snapToCenter: { default: true },
    debug: { default: false },

    targetId: { default: "empty" },
    originalTargetScale: { default: new THREE.Vector3(1, 1, 1) }
  },

  init() {
    this.tmpWorldPosition = new THREE.Vector3();
    //TODO these visuals need work
    this.el.setObject3D(
      "guide",
      new THREE.Mesh(
        new THREE.BoxGeometry(this.data.bounds.x, this.data.bounds.y, this.data.bounds.z),
        new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color(0x2f80ed) }
          },
          vertexShader: `
            varying vec2 vUv;
            void main()
            {
              gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
              vUv = uv;
            }
          `,
          fragmentShader: `
            // adapted from https://www.shadertoy.com/view/Mlt3z8
            float bayerDither2x2( vec2 v ) {
              return mod( 3.0 * v.y + 2.0 * v.x, 4.0 );
            }
            float bayerDither4x4( vec2 v ) {
              vec2 P1 = mod( v, 2.0 );
              vec2 P2 = mod( floor( 0.5  * v ), 2.0 );
              return 4.0 * bayerDither2x2( P1 ) + bayerDither2x2( P2 );
            }

            varying vec2 vUv;
            uniform vec3 color;
            void main() {
              float alpha = max(step(0.45, abs(vUv.x - 0.5)), step(0.45, abs(vUv.y - 0.5))) - 0.5;
              if( ( bayerDither4x4( floor( mod( gl_FragCoord.xy, 4.0 ) ) ) ) / 16.0 >= alpha ) discard;
              gl_FragColor = vec4(color, 1.0);
            }
          `,
          side: THREE.DoubleSide
        })
      )
    );
  },

  update(oldData) {
    // TODO we may want to support dynamic bounds updates, but its currently
    // a pain since runtime shape modifications have lots of issues

    if (this.data.debug) {
      console.log(
        `${this.el.id}: ${oldData.targetId}(${JSON.stringify(oldData.originalTargetScale)}) -> ${
          this.data.targetId
        }(${JSON.stringify(this.data.originalTargetScale)})`
      );
    }

    // Ownership race, whoever owns the old object needs to take care of "ejecting" it
    if (oldData.targetId !== "empty" && oldData.targetId !== this.data.targetId) {
      const capturedEl = document.getElementById(oldData.targetId);
      if (capturedEl && NAF.utils.isMine(capturedEl)) {
        capturedEl.object3D.translateZ(this.data.bounds.z);
        capturedEl.object3D.scale.copy(oldData.originalTargetScale);
        capturedEl.object3D.matrixNeedsUpdate = true;
        capturedEl.components["floaty-object"].setLocked(false);
      }
    }
  },

  play() {
    components.push(this);
    if (this.el.components.networked) {
      applyPersistentSync(this.el.components.networked.data.networkId);
    }
  },

  pause() {
    components.splice(components.indexOf(this), 1);
  },

  tick(_, dt) {
    if (this.mixer) {
      this.mixer.update(dt / 1000);
    }
  },

  showPreview(capturableEntity) {
    if (!this.preview) {
      const srcMesh = capturableEntity.getObject3D("mesh");
      const clonedMesh = cloneObject3D(srcMesh, false);

      clonedMesh.traverse(node => {
        if (node.isMesh) {
          if (node.material) {
            node.material = node.material.clone();
            node.material.transparent = true;
            node.material.opacity = 0.5;
            node.material.needsUpdate = true;
          }
        }
      });

      const loopAnimation = capturableEntity.components["loop-animation"];
      if (loopAnimation && loopAnimation.isPlaying) {
        const originalAnimation = loopAnimation.currentActions[loopAnimation.data.activeClipIndex];
        const animation = clonedMesh.animations[loopAnimation.data.activeClipIndex];
        this.mixer = new THREE.AnimationMixer(clonedMesh);
        const action = this.mixer.clipAction(animation);
        action.syncWith(originalAnimation);
        action.setLoop(THREE.LoopRepeat, Infinity).play();
      }

      // Reset offsets
      clonedMesh.position.set(0, 0, 0);
      clonedMesh.quaternion.identity();
      let aabb = new THREE.Box3().setFromObject(clonedMesh);
      const size = new THREE.Vector3();
      aabb.getSize(size);
      let center = new THREE.Vector3();
      aabb.getCenter(center);
      clonedMesh.position.copy(center);
      clonedMesh.position.multiplyScalar(-1);
      clonedMesh.matrixNeedsUpdate = true;
      this.preview = new THREE.Object3D();
      this.el.sceneEl.object3D.add(this.preview);
      this.preview.add(clonedMesh);

      // Apply preview mesh transforms to match the frame ones
      this.el.object3D.updateWorldMatrix(true);
      const worldPos = new THREE.Vector3();
      this.el.object3D.getWorldPosition(worldPos);
      const worldQuat = new THREE.Quaternion();
      this.el.object3D.getWorldQuaternion(worldQuat);
      this.preview.position.copy(worldPos);
      this.preview.scale.multiplyScalar(scaleForAspectFit(this.data.bounds, size));
      this.preview.setRotationFromQuaternion(worldQuat);
      this.preview.matrixNeedsUpdate = true;

      if (DEBUG) {
        const quat = this.preview.quaternion.clone();
        this.preview.quaternion.identity();
        this.preview.matrixNeedsUpdate = true;
        this.preview.updateMatrixWorld(true);
        aabb = new THREE.Box3().setFromObject(this.preview);
        this.preview.quaternion.copy(quat);
        this.preview.matrixNeedsUpdate = true;
        this.preview.updateMatrixWorld(true);
        this.helperBBAA = new THREE.Box3Helper(aabb, 0xffff00);
        this.helperBBAA.setRotationFromQuaternion(this.preview.quaternion);
        this.el.sceneEl.object3D.add(this.helperBBAA);

        this.centerBBAA = new THREE.AxesHelper(0.25);
        center = new THREE.Vector3();
        aabb.getCenter(center);
        this.centerBBAA.position.copy(center);
        this.centerBBAA.setRotationFromQuaternion(this.preview.quaternion);
        this.el.sceneEl.object3D.add(this.centerBBAA);
      }
    }
  },

  hidePreview() {
    if (this.preview) {
      this.el.sceneEl.object3D.remove(this.preview);
      if (this.mixer) {
        this.mixer.stopAllAction();
        this.mixer.uncacheRoot(this.preview);
        this.mixer = null;
      }
      disposeNode(this.preview);
      this.preview = null;

      if (DEBUG) {
        this.el.sceneEl.object3D.remove(this.helperBBAA);
        this.el.sceneEl.object3D.remove(this.centerBBAA);
      }
    }
  },

  snapObject(capturedEl) {
    this.el.object3D.getWorldPosition(this.tmpWorldPosition);
    capturedEl.object3D.position.copy(this.tmpWorldPosition);
    const worldQuat = new THREE.Quaternion();
    this.el.object3D.getWorldQuaternion(worldQuat);
    capturedEl.object3D.setRotationFromQuaternion(worldQuat);
    capturedEl.object3D.matrixNeedsUpdate = true;
    capturedEl.components["floaty-object"].setLocked(true);
  },

  capture(capturableEntity) {
    if (NAF.utils.isMine(this.el) || NAF.utils.takeOwnership(this.el)) {
      const update = () => {
        this.el.setAttribute("media-frame", {
          targetId: capturableEntity.id,
          originalTargetScale: new THREE.Vector3().copy(capturableEntity.object3D.scale)
        });

        capturableEntity.object3D.scale.set(1, 1, 1);
        capturableEntity.object3D.quaternion.identity();
        capturableEntity.object3D.matrixNeedsUpdate = true;
        capturableEntity.object3D.updateMatrixWorld();
        const srcMesh = capturableEntity.getObject3D("mesh");
        const size = new THREE.Vector3();
        new THREE.Box3().setFromObject(srcMesh).getSize(size);

        capturableEntity.object3D.scale.multiplyScalar(scaleForAspectFit(this.data.bounds, size));
        capturableEntity.object3D.matrixNeedsUpdate = true;

        this.snapObject(capturableEntity);
      };

      // Make sure we snap the media element when it's loaded (otherwise we may only snap the loading object)
      if (capturableEntity.components["media-loader"].isPlaying) {
        capturableEntity.addEventListener(
          "media-loaded",
          () => {
            update();
          },
          { once: true }
        );
      }

      update();

      this.hidePreview();
    } else {
      // TODO what do we do about this state? should evenetually resolve itself as it will try again next frame...
      console.error("failed to take ownership of media frame");
    }
  },

  release() {
    if (NAF.utils.isMine(this.el) || NAF.utils.takeOwnership(this.el)) {
      const capturedEl = document.getElementById(this.data.targetId);

      this.el.setAttribute("media-frame", {
        targetId: "empty"
      });

      if (capturedEl) {
        capturedEl.object3D.scale.copy(this.data.originalTargetScale);
        capturedEl.object3D.matrixNeedsUpdate = true;
        capturedEl.components["floaty-object"].setLocked(false);
      }
    } else {
      console.error("failed to take ownership of media frame");
    }
  }
});
