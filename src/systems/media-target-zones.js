import { isTagged, setTag } from "../components/tags";

function scaleForAspectFit(containerSize, itemSize) {
  return Math.min(containerSize.x / itemSize.x, containerSize.y / itemSize.y);
}

function isCapturable(el) {
  return el && (el.components["media-image"] || el.components["media-video"]) && NAF.utils.isMine(el);
}

function getCapturableObjectCollidingWithBody(physicsSystem, bodyUUID) {
  const collisions = physicsSystem.getCollisions(bodyUUID);
  for (let i = 0; i < collisions.length; i++) {
    const bodyData = physicsSystem.bodyUuidToData.get(collisions[i]);
    const mediaObjectEl = bodyData && bodyData.object3D && bodyData.object3D.el;
    if (isCapturable(mediaObjectEl)) {
      return mediaObjectEl.object3D;
    }
  }
  return null;
}

const components = [];
export class MediaTargetZonesSystem {
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
      const objectToCapture = getCapturableObjectCollidingWithBody(this.physicsSystem, bodyUUID);

      const previewMesh = zone.el.getObject3D("preview");
      const debugMesh = zone.el.getObject3D("debug");

      debugMesh.visible = this.interactionSystem.isHoldingAnything(isCapturable);

      if (zone.state === TARGET_ZONE_STATE.EMPTY) {
        // TODO not sure if we want to use tags for this
        if (objectToCapture && !isTagged(objectToCapture.el, "isHoveringMediaTargetZone")) {
          setTag(objectToCapture.el, "isHoveringMediaTargetZone");

          zone.state = TARGET_ZONE_STATE.HOVERING;
          zone.target = objectToCapture;

          const imageObject3D = objectToCapture.el.getObject3D("mesh");
          // TODO this feels a bit hacky and error prone
          if (imageObject3D.material) {
            previewMesh.material.map = imageObject3D.material.map;
          }
          previewMesh.material.needsUpdate = true;
          previewMesh.scale.copy(imageObject3D.scale);
          previewMesh.scale.multiplyScalar(scaleForAspectFit(zone.mediaSize, imageObject3D.scale));
          previewMesh.matrixNeedsUpdate = true;
          previewMesh.visible = true;

          debugMesh.material.color.set(0x0000ff);
          console.log(zone.el.id, "hover");
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

          debugMesh.material.color.set(0xff0000);
          console.log(zone.el.id, "exit");
        }

        if (
          zone.state === TARGET_ZONE_STATE.HOVERING &&
          zone.target &&
          !this.interactionSystem.isHeld(zone.target.el)
        ) {
          zone.originalTargetScale.copy(zone.target.scale);
          zone.state = TARGET_ZONE_STATE.FULL;

          zone.target.position.copy(zone.el.object3D.position);
          zone.target.rotation.copy(zone.el.object3D.rotation);
          zone.target.scale.setScalar(scaleForAspectFit(zone.mediaSize, zone.target.el.getObject3D("mesh").scale));
          zone.target.el.components["floaty-object"].setLocked(true);

          previewMesh.visible = false;

          debugMesh.material.color.set(0x00ff00);
          console.log(zone.el.id, "stored scale", zone.originalTargetScale);
        }
      }
    }
  }
}

const TARGET_ZONE_STATE = {
  EMPTY: "empty",
  HOVERING: "hovering",
  FULL: "full"
};

AFRAME.registerComponent("media-target-zone", {
  schema: {},

  init() {
    this.state = TARGET_ZONE_STATE.EMPTY;
    this.target = null;
    this.originalTargetScale = new THREE.Vector3(1, 1, 1);

    this.mediaSize = new THREE.Vector3();
    // TODO media size and hitbox don't need to be linked
    this.mediaSize.copy(this.el.components["shape-helper"].data.halfExtents);
    this.mediaSize.multiplyScalar(2);
  },

  play() {
    components.push(this);

    // TODO remove debug
    this.el.setObject3D(
      "debug",
      new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.BoxGeometry(this.mediaSize.x, this.mediaSize.y, this.mediaSize.z))
      )
    );

    // this.el.setObject3D(
    //   "debug",
    //   new THREE.Mesh(
    //     new THREE.BoxBufferGeometry(this.mediaSize.x, this.mediaSize.y, this.mediaSize.z),
    //     new THREE.MeshToonMaterial({
    //       opacity: 0.2,
    //       transparent: true,
    //       depthWrite: false,
    //       side: THREE.DoubleSide
    //     })
    //   )
    // );

    const previewMaterial = new THREE.MeshBasicMaterial();
    previewMaterial.side = THREE.DoubleSide;
    previewMaterial.transparent = true;
    previewMaterial.opacity = 0.5;

    const flipY = window.createImageBitmap === undefined;
    const geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1, flipY);
    const previewMesh = new THREE.Mesh(geometry, previewMaterial);
    previewMesh.visible = false;
    this.el.setObject3D("preview", previewMesh);
  },

  pause() {
    components.splice(components.indexOf(this), 1);
  }
});
