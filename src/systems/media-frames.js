import { isTagged, setTag } from "../components/tags";
import { MediaType } from "../utils/media-utils";
import { TEXTURES_FLIP_Y } from "../loaders/HubsTextureLoader";
import { applyPersistentSync } from "../utils/permissions-utils";

function scaleForAspectFit(containerSize, itemSize) {
  return Math.min(containerSize.x / itemSize.x, containerSize.y / itemSize.y);
}

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

function getCapturableEntityCollidingWithBody(physicsSystem, mediaType, bodyUUID) {
  const collisions = physicsSystem.getCollisions(bodyUUID);
  for (let i = 0; i < collisions.length; i++) {
    const bodyData = physicsSystem.bodyUuidToData.get(collisions[i]);
    const mediaObjectEl = bodyData && bodyData.object3D && bodyData.object3D.el;
    if (isCapturableByType[mediaType](mediaObjectEl)) {
      return mediaObjectEl;
    }
  }
  return null;
}

function isColliding(physicsSystem, entityA, entityB) {
  const bodyAUUID = entityA.components["body-helper"].uuid;
  const bodyBUUID = entityB.components["body-helper"].uuid;

  // TODO would be nice to fix the timing so we don't need to check this
  if (!(physicsSystem.bodyInitialized(bodyAUUID) && physicsSystem.bodyInitialized(bodyBUUID))) return false;

  const collisions = physicsSystem.getCollisions(bodyAUUID);
  for (let i = 0; i < collisions.length; i++) {
    if (collisions[i] === bodyBUUID) return true;
  }
  return false;
}

const components = [];
export class MediaFramesSystem {
  constructor(physicsSystem, interactionSystem) {
    this.physicsSystem = physicsSystem;
    this.interactionSystem = interactionSystem;
  }

  tick() {
    for (let i = 0; i < components.length; i++) {
      const zone = components[i];

      const bodyUUID = zone.el.components["body-helper"].uuid;
      // TODO would be nice to fix the timing so we don't need to check this
      if (!this.physicsSystem.bodyInitialized(bodyUUID)) continue;

      const previewMesh = zone.el.getObject3D("preview");
      const guideMesh = zone.el.getObject3D("guide");

      guideMesh.visible = true; //this.interactionSystem.isHoldingAnything(isCapturableByType[zone.data.mediaType]);
      const holdingSomethingCapturable = this.interactionSystem.isHoldingAnything(
        isCapturableByType[zone.data.mediaType]
      );

      // guideMesh.material.uniforms.color.value.set(0x6fc0fd);
      // guideMesh.material.uniforms.color.value.set(0x2f80ed);
      // guideMesh.material.uniforms.color.value.set(0x00ff00);
      // guideMesh.material.uniforms.color.value.set(0x808080);

      if (zone.data.targetId === "empty") {
        // zone empty
        guideMesh.material.uniforms.color.value.set(holdingSomethingCapturable ? 0xff00ff : 0xffffff);
        const capturableEl = getCapturableEntityCollidingWithBody(this.physicsSystem, zone.data.mediaType, bodyUUID);
        if (capturableEl && NAF.utils.isMine(capturableEl)) {
          // capturable object I own is colliding with an empty zone
          if (this.interactionSystem.isHeld(capturableEl)) {
            // held object I own colliding with an empty zone, show preview
            guideMesh.material.uniforms.color.value.set(0x00ff00);
            zone.showPreview(capturableEl);
          } else {
            // non-held object I own colliding with an empty zone, capture
            guideMesh.material.uniforms.color.value.set(0x0000ff);
            zone.capture(capturableEl);
          }
        } else {
          // no capturable object I own is colliding with this empty zone, hide preview
          zone.hidePreview();
        }
      } else {
        // zone full
        guideMesh.material.uniforms.color.value.set(0xff0000);
        zone.hidePreview();
        let capturedEl = document.getElementById(zone.data.targetId);
        if (capturedEl) {
          if (NAF.utils.isMine(capturedEl)) {
            if (this.interactionSystem.isHeld(capturedEl)) {
              if (!isColliding(this.physicsSystem, zone.el, capturedEl)) {
                // holding the captured object and its no longer colliding, releasee it
                zone.release();
              } else {
                // holding within bounds, do nothing
              }
            } else if (zone.data.snapToCenter && this.interactionSystem.wasReleasedThisFrame(capturedEl)) {
              // released in bounds, re-snap
              zone.snapObject(capturedEl);
            }
          }
        } else {
          // captured object was removed
          zone.release();
        }
      }
    }
  }
}

AFRAME.registerComponent("media-frame", {
  schema: {
    bounds: { default: new THREE.Vector3(1, 1, 1) },
    mediaType: { default: MediaType.ALL_2D, oneOf: Object.values(MediaType) },
    snapToCenter: { default: true },

    targetId: { default: "empty" },
    originalTargetScale: { default: new THREE.Vector3(1, 1, 1) }
  },

  init() {
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

    const previewMaterial = new THREE.MeshBasicMaterial();
    previewMaterial.side = THREE.DoubleSide;
    previewMaterial.transparent = true;
    previewMaterial.opacity = 0.5;

    const geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1, TEXTURES_FLIP_Y);
    const previewMesh = new THREE.Mesh(geometry, previewMaterial);
    previewMesh.visible = false;
    this.el.setObject3D("preview", previewMesh);

    // NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
    //   this.networkedEl = networkedEl;
    //   if (NAF.utils.getNetworkOwner(networkedEl) === "scene") {
    //     setTimeout(() => {
    //       if (NAF.utils.getNetworkOwner(networkedEl) === "scene") {
    //         console.log("taking ownership of zone", this.el.id, this.el === networkedEl);
    //         NAF.utils.takeOwnership(networkedEl);
    //       }
    //     }, 2000 + Math.floor(Math.random() * 2000));
    //   }
    // });
  },

  update(oldData) {
    // TODO we may want to support dynamic bounds updates, but its currently
    // a pain since the physics system is pretty runtime shape modifications

    // TODO handle change from non empty to non empty meaning ownership race happened
    // whoever owned oldData.targetId should handle moving it out and scaling it back down

    // console.log(JSON.stringify(oldData, null, 4), JSON.stringify(this.data, null, 4));
    console.log(
      `${this.el.id}: ${oldData.targetId}(${JSON.stringify(oldData.originalTargetScale)}) -> ${
        this.data.targetId
      }(${JSON.stringify(this.data.originalTargetScale)})`
    );
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

  // TODO this "preview" feels a bit hacky and error prone, also needs support for previewing 3D objects
  showPreview(capturableEntity) {
    const srcMesh = capturableEntity.getObject3D("mesh");

    if (!isCapturableByType[MediaType.ALL_2D](capturableEntity) || !(srcMesh && srcMesh.material)) return;
    const previewMesh = this.el.getObject3D("preview");

    previewMesh.material.map = srcMesh.material.map;
    previewMesh.material.needsUpdate = true;

    // Preview mesh UVs are set to accomidate textureLoader default, but video textures don't match this
    previewMesh.scale.y *= TEXTURES_FLIP_Y !== previewMesh.material.map.flipY ? -1 : 1;
    previewMesh.scale.copy(srcMesh.scale);
    previewMesh.scale.multiplyScalar(scaleForAspectFit(this.data.bounds, srcMesh.scale));
    previewMesh.matrixNeedsUpdate = true;
    previewMesh.visible = true;
  },

  hidePreview() {
    const previewMesh = this.el.getObject3D("preview");
    previewMesh.material.map = null;
    previewMesh.material.needsUpdate = true;
    previewMesh.visible = false;
  },

  snapObject(capturedEl) {
    capturedEl.object3D.position.copy(this.el.object3D.position);
    capturedEl.object3D.rotation.copy(this.el.object3D.rotation);
    capturedEl.object3D.matrixNeedsUpdate = true;
    capturedEl.components["floaty-object"].setLocked(true);
  },

  capture(capturableEntity) {
    if (NAF.utils.isMine(this.el) || NAF.utils.takeOwnership(this.el)) {
      console.log("capturing object in zone", capturableEntity.id);
      this.el.setAttribute("media-frame", {
        targetId: capturableEntity.id,
        originalTargetScale: new THREE.Vector3().copy(capturableEntity.object3D.scale)
      });
      capturableEntity.object3D.position.copy(this.el.object3D.position);
      capturableEntity.object3D.rotation.copy(this.el.object3D.rotation);
      capturableEntity.object3D.scale.setScalar(
        scaleForAspectFit(this.data.bounds, capturableEntity.getObject3D("mesh").scale)
      );
      capturableEntity.object3D.matrixNeedsUpdate = true;
      capturableEntity.components["floaty-object"].setLocked(true);
      this.hidePreview();
    } else {
      // TODO what do we do about this state? should evenetually resolve itself as it will try again next frame...
      console.error("failed to take ownership");
    }
  },

  release() {
    if (NAF.utils.isMine(this.el) || NAF.utils.takeOwnership(this.el)) {
      console.log("relaese object");
      let capturedEl = document.getElementById(this.data.targetId);

      this.el.setAttribute("media-frame", {
        targetId: "empty"
      });

      if (capturedEl) {
        capturedEl.object3D.scale.copy(this.data.originalTargetScale);
        capturedEl.object3D.matrixNeedsUpdate = true;
        capturedEl.components["floaty-object"].setLocked(false);
      }
    } else {
      console.error("failed to take ownership");
    }
  }
});
