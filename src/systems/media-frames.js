import { isTagged, setTag } from "../components/tags";
import { MediaType } from "../utils/media-utils";
import { TEXTURES_FLIP_Y } from "../loaders/HubsTextureLoader";

const TARGET_ZONE_STATE = {
  EMPTY: "empty",
  HOVERING: "hovering",
  FULL: "full"
};

function scaleForAspectFit(containerSize, itemSize) {
  return Math.min(containerSize.x / itemSize.x, containerSize.y / itemSize.y);
}

const isCapturableByType = {
  [MediaType.ALL]: function(el) {
    return !!(el && NAF.utils.isMine(el) && el.components["media-loader"]);
  },
  [MediaType.ALL_2D]: function(el) {
    return !!(
      el &&
      NAF.utils.isMine(el) &&
      (el.components["media-image"] || el.components["media-video"] || el.components["media-pdf"])
    );
  },
  [MediaType.MODEL]: function(el) {
    return !!(el && NAF.utils.isMine(el) && el.components["gltf-model-plus"]);
  },
  [MediaType.IMAGE]: function(el) {
    return !!(el && NAF.utils.isMine(el) && el.components["media-image"]);
  },
  [MediaType.VIDEO]: function(el) {
    return !!(el && NAF.utils.isMine(el) && el.components["media-video"]);
  },
  [MediaType.PDF]: function(el) {
    return !!(el && NAF.utils.isMine(el) && el.components["media-pdf"]);
  }
};

function getCapturableObjectCollidingWithBody(physicsSystem, mediaType, bodyUUID) {
  const collisions = physicsSystem.getCollisions(bodyUUID);
  for (let i = 0; i < collisions.length; i++) {
    const bodyData = physicsSystem.bodyUuidToData.get(collisions[i]);
    const mediaObjectEl = bodyData && bodyData.object3D && bodyData.object3D.el;
    if (isCapturableByType[mediaType](mediaObjectEl)) {
      return mediaObjectEl.object3D;
    }
  }
  return null;
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

      const objectToCapture = getCapturableObjectCollidingWithBody(this.physicsSystem, zone.data.mediaType, bodyUUID);

      const previewMesh = zone.el.getObject3D("preview");
      const guideMesh = zone.el.getObject3D("guide");

      guideMesh.visible = this.interactionSystem.isHoldingAnything(isCapturableByType[zone.data.mediaType]);

      if (zone.state === TARGET_ZONE_STATE.EMPTY) {
        // TODO not sure if we want to use tags for this
        if (objectToCapture && !isTagged(objectToCapture.el, "isHoveringMediaTargetZone")) {
          setTag(objectToCapture.el, "isHoveringMediaTargetZone");

          zone.state = TARGET_ZONE_STATE.HOVERING;
          zone.target = objectToCapture;

          const imageObject3D = objectToCapture.el.getObject3D("mesh");

          // TODO this feels a bit hacky and error prone, also needs support for previewing 3D objects
          if (isCapturableByType[MediaType.ALL_2D]) {
            if (imageObject3D.material) {
              previewMesh.material.map = imageObject3D.material.map;
            }
            previewMesh.material.needsUpdate = true;
            previewMesh.scale.copy(imageObject3D.scale);
            previewMesh.scale.multiplyScalar(scaleForAspectFit(zone.data.bounds, imageObject3D.scale));
            // Preview mesh UVs are set to accomidate textureLoader default, but video textures don't match this
            previewMesh.scale.y *= TEXTURES_FLIP_Y !== previewMesh.material.map.flipY ? -1 : 1;
            previewMesh.matrixNeedsUpdate = true;
            previewMesh.visible = true;
          }

          guideMesh.material.uniforms.color.value.set(0x6fc0fd);
        }
      } else {
        // TODO currently this works because the object will continue to collide, we may not want this
        if (!objectToCapture) {
          // TODO these cmp.target.el are to handle object being destroyed while captured, but they feel a bit ugly
          zone.target.el && setTag(zone.target.el, "isHoveringMediaTargetZone", false);

          if (zone.state === TARGET_ZONE_STATE.FULL) {
            zone.target.scale.copy(zone.originalTargetScale);
            zone.target.matrixNeedsUpdate = true;
            zone.target.el && zone.target.el.components["floaty-object"].setLocked(false);
          }

          zone.state = TARGET_ZONE_STATE.EMPTY;
          zone.target = null;

          previewMesh.material.map = null;
          previewMesh.material.needsUpdate = true;
          previewMesh.visible = false;

          guideMesh.material.uniforms.color.value.set(0x2f80ed);
        }

        if (zone.state === TARGET_ZONE_STATE.FULL && zone.data.dynamic) {
          zone.target.position.copy(zone.el.object3D.position);
          zone.target.rotation.copy(zone.el.object3D.rotation);
          // zone.target.scale.setScalar(scaleForAspectFit(zone.data.bounds, zone.originalTargetScale));
        } else if (
          zone.state === TARGET_ZONE_STATE.HOVERING &&
          zone.target &&
          !this.interactionSystem.isHeld(zone.target.el)
        ) {
          zone.originalTargetScale.copy(zone.target.scale);
          zone.state = TARGET_ZONE_STATE.FULL;

          zone.target.position.copy(zone.el.object3D.position);
          zone.target.rotation.copy(zone.el.object3D.rotation);
          zone.target.scale.setScalar(scaleForAspectFit(zone.data.bounds, zone.target.el.getObject3D("mesh").scale));
          zone.target.el.components["floaty-object"].setLocked(true);

          previewMesh.visible = false;

          guideMesh.material.uniforms.color.value.set(0x808080);
        }
      }
    }
  }
}

AFRAME.registerComponent("media-frame", {
  schema: {
    bounds: { default: new THREE.Vector3(1, 1, 1) },
    mediaType: { default: MediaType.ALL_2D, oneOf: Object.values(MediaType) },
    dynamic: { default: false }
  },

  init() {
    this.state = TARGET_ZONE_STATE.EMPTY;
    this.target = null;
    this.originalTargetScale = new THREE.Vector3(1, 1, 1);
  },

  play() {
    components.push(this);

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
  },

  pause() {
    components.splice(components.indexOf(this), 1);
  }
});
