import { cylinderTextureSrc } from "./cylinder-texture";
import { SOUND_TELEPORT_START, SOUND_TELEPORT_END } from "../systems/sound-effects-system";
import { getMeshes } from "../utils/aframe-utils";

import { textureLoader } from "../utils/media-utils";

const CYLINDER_TEXTURE = textureLoader.load(cylinderTextureSrc);

function easeIn(t) {
  return t * t;
}

function easeOutIn(t) {
  if (t < 0.5) return 0.5 * ((t = t * 2 - 1) * t * t + 1);
  return 0.5 * (t = t * 2 - 1) * t * t + 0.5;
}

const UP = new THREE.Vector3(0, 1, 0);

class RayCurve extends THREE.Mesh {
  constructor(numPoints, width) {
    super(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        toneMapped: false,
        transparent: true
      })
    );

    this.vertices = new Float32Array(numPoints * 3 * 6);
    this.width = width;

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.vertices, 3).setUsage(THREE.DynamicDrawUsage)
    );

    this.frustumCulled = false;

    this.direction = new THREE.Vector3();
    this.numPoints = numPoints;
  }

  setDirection(direction) {
    this.direction
      .copy(direction)
      .cross(UP)
      .normalize()
      .multiplyScalar(this.width / 2);
  }

  setWidth(width) {
    this.width = width;
  }

  setPoint = (function() {
    const A = new THREE.Vector3();
    const B = new THREE.Vector3();
    const C = new THREE.Vector3();
    const D = new THREE.Vector3();

    return function(i, P) {
      let idx = 3 * 6 * i;

      A.copy(P).add(this.direction);
      B.copy(P).sub(this.direction);
      C.set(
        // Previous A
        i === 0 ? A.x : this.vertices[idx - 3],
        i === 0 ? A.y : this.vertices[idx - 2],
        i === 0 ? A.z : this.vertices[idx - 1]
      );
      D.set(
        // Previous B
        i === 0 ? B.x : this.vertices[idx - 6],
        i === 0 ? B.y : this.vertices[idx - 5],
        i === 0 ? B.z : this.vertices[idx - 4]
      );

      //   A---P---B
      //   | \     |
      //   |  \    |
      //   |   \   |
      //   |    \  |
      //   |     \ |
      //   |      \|
      //   C-------D
      //   A'--P'--B' Previous P
      //   | \     |

      this.vertices[idx++] = A.x;
      this.vertices[idx++] = A.y;
      this.vertices[idx++] = A.z;

      this.vertices[idx++] = C.x;
      this.vertices[idx++] = C.y;
      this.vertices[idx++] = C.z;

      this.vertices[idx++] = D.x;
      this.vertices[idx++] = D.y;
      this.vertices[idx++] = D.z;

      this.vertices[idx++] = D.x;
      this.vertices[idx++] = D.y;
      this.vertices[idx++] = D.z;

      this.vertices[idx++] = B.x;
      this.vertices[idx++] = B.y;
      this.vertices[idx++] = B.z;

      this.vertices[idx++] = A.x;
      this.vertices[idx++] = A.y;
      this.vertices[idx++] = A.z;

      this.geometry.attributes.position.needsUpdate = true;
    };
  })();
}

function parabolicCurve(p0, v0, t, out) {
  out.x = p0.x + v0.x * t;
  out.y = p0.y + v0.y * t - 4.9 * t * t;
  out.z = p0.z + v0.z * t;
  return out;
}

function isValidNormalsAngle(collisionNormal, referenceNormal, landingMaxAngle) {
  const angleNormals = referenceNormal.angleTo(collisionNormal);
  return THREE.Math.RAD2DEG * angleNormals <= landingMaxAngle;
}

const checkLineIntersection = (function() {
  const direction = new THREE.Vector3();
  return function checkLineIntersection(start, end, meshes, raycaster, referenceNormal, landingMaxAngle, hitPoint) {
    direction.copy(end).sub(start);
    const distance = direction.length();
    raycaster.far = distance;
    raycaster.set(start, direction.normalize());
    const intersects = raycaster.intersectObjects(meshes, true);
    if (intersects.length > 0 && isValidNormalsAngle(intersects[0].face.normal, referenceNormal, landingMaxAngle)) {
      hitPoint.copy(intersects[0].point);
      return true;
    }
    return false;
  };
})();

const MISS_OPACITY = 0.1;
const HIT_OPACITY = 0.3;
const MISS_COLOR = 0xff0000;
const HIT_COLOR = 0x99ff99;
const FORWARD = new THREE.Vector3(0, 0, -1);
const LANDING_NORMAL = new THREE.Vector3(0, 1, 0);
const MAX_LANDING_ANGLE = 45;
const DRAW_TIME_MS = 400;
const q = new THREE.Quaternion();
const vecHelper = new THREE.Vector3();
const v = new THREE.Vector3();

let uiRoot;
AFRAME.registerComponent("teleporter", {
  schema: {
    start: { type: "string" },
    confirm: { type: "string" },
    speed: { default: 12 },
    collisionEntities: { default: "" },
    hitCylinderColor: { type: "color", default: "#99ff99" },
    hitCylinderRadius: { default: 0.25, min: 0 },
    outerRadius: { default: 0.6, min: 0 },
    hitCylinderHeight: { default: 0.3, min: 0 }
  },

  init() {
    this.characterController = this.el.sceneEl.systems["hubs-systems"].characterController;
    this.isTeleporting = false;
    this.rayCurve = new RayCurve(20, 0.025);
    this.rayCurve.visible = false;
    this.el.sceneEl.object3D.add(this.rayCurve);

    this.p0 = new THREE.Vector3();
    this.v0 = new THREE.Vector3();
    this.parabola = Array.from(new Array(this.rayCurve.numPoints), () => new THREE.Vector3());
    this.hit = false;
    this.hitPoint = new THREE.Vector3();
    this.meshes = [];
    this.raycaster = new THREE.Raycaster();
    this.rigWorldPosition = new THREE.Vector3();
    this.newRigWorldPosition = new THREE.Vector3();
    this.teleportOriginWorldPosition = new THREE.Vector3();

    this.teleportEventDetail = {
      oldPosition: this.rigWorldPosition,
      newPosition: this.newRigWorldPosition,
      hitPoint: this.hitPoint
    };
    this.prevHitHeight = 0;
    this.direction = new THREE.Vector3();
    this.hitEntity = this.createHitEntity();
    this.hitEntity.visible = false;
    this.el.sceneEl.object3D.add(this.hitEntity);
    this.queryCollisionEntities();
  },

  queryCollisionEntities: function() {
    this.collisionEntities = [].slice.call(this.el.sceneEl.querySelectorAll(this.data.collisionEntities));
    this.meshes = getMeshes(this.collisionEntities);
  },

  remove() {
    this.stopPlayingTeleportSound();
  },

  stopPlayingTeleportSound() {
    if (this.teleportingSound) {
      const sfx = this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem;
      sfx.stopSoundNode(this.teleportingSound.source);
      this.teleportingSound = null;
    }
  },

  tick(t, dt) {
    uiRoot = uiRoot || document.getElementById("ui-root");
    const entered = this.el.sceneEl.is("entered");
    const isGhost = !entered && uiRoot && uiRoot.firstChild && uiRoot.firstChild.classList.contains("isGhost");
    if (!entered && !isGhost) return;
    const sfx = this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem;
    const userinput = AFRAME.scenes[0].systems.userinput;
    const { start, confirm, speed } = this.data;
    const object3D = this.el.object3D;

    if (
      !this.isTeleporting &&
      userinput.get(start) &&
      !this.characterController.isTeleportingDisabled &&
      !window.APP.store.state.preferences.disableTeleporter
    ) {
      this.isTeleporting = true;
      this.timeTeleporting = 0;
      this.hit = false;
      this.rayCurve.visible = true;
      this.rayCurve.updateMatrixWorld();
      this.rayCurve.material.opacity = MISS_OPACITY;
      this.rayCurve.material.color.set(MISS_COLOR);
      this.rayCurve.material.needsUpdate = true;
      this.teleportingSound = sfx.playSoundLoopedWithGain(SOUND_TELEPORT_START);
      if (this.teleportingSound) {
        this.teleportingSound.gain.gain.value = 0.005;
      }
    }

    if (!this.isTeleporting) {
      return;
    }
    if (this.teleportingSound) {
      this.teleportingSound.gain.gain.value = Math.min(0.025, this.teleportingSound.gain.gain.value + 0.00002 * dt);
    }

    if (userinput.get(confirm)) {
      this.hitEntity.visible = false;
      this.isTeleporting = false;
      this.rayCurve.visible = false;

      if (this.teleportingSound) {
        this.stopPlayingTeleportSound();
      }

      if (!this.hit || this.timeTeleporting < DRAW_TIME_MS) {
        return;
      }

      this.characterController.teleportTo(this.hitPoint);

      sfx.playSoundOneShot(SOUND_TELEPORT_END);
      return;
    }

    this.timeTeleporting += dt;
    object3D.updateMatrixWorld();
    object3D.matrixWorld.decompose(this.p0, q, vecHelper);
    this.direction
      .copy(FORWARD)
      .applyQuaternion(q)
      .normalize();
    this.rayCurve.setDirection(this.direction);
    this.el.object3D.updateMatrices();
    const playerScale = v.setFromMatrixColumn(this.characterController.avatarPOV.object3D.matrixWorld, 1).length();
    this.v0.copy(this.direction).multiplyScalar(speed * Math.sqrt(playerScale));

    let collidedIndex = this.rayCurve.numPoints - 1;

    this.hit = false;
    this.parabola[0].copy(this.p0);
    const timeSegment = 1 / (this.rayCurve.numPoints - 1);
    for (let i = 1; i < this.rayCurve.numPoints; i++) {
      const t = i * timeSegment;
      parabolicCurve(this.p0, this.v0, t, vecHelper);
      this.parabola[i].copy(vecHelper);

      if (
        checkLineIntersection(
          this.parabola[i - 1],
          this.parabola[i],
          this.meshes,
          this.raycaster,
          LANDING_NORMAL,
          MAX_LANDING_ANGLE,
          this.hitPoint
        )
      ) {
        this.hit = true;
        collidedIndex = i;
        break;
      }
    }
    if (this.characterController.isTeleportingDisabled) {
      this.hit = false;
    }

    const percentToDraw = this.timeTeleporting > DRAW_TIME_MS ? 1 : this.timeTeleporting / DRAW_TIME_MS;
    const percentRaycasted = collidedIndex / (this.rayCurve.numPoints - 1);
    const segmentT = (percentToDraw * percentRaycasted) / (this.rayCurve.numPoints - 1);

    for (let i = 0; i < this.rayCurve.numPoints; i++) {
      const t = i * segmentT;
      parabolicCurve(this.p0, this.v0, t, vecHelper);
      this.rayCurve.setPoint(i, vecHelper);
    }

    const color = this.hit ? HIT_COLOR : MISS_COLOR;
    const opacity = this.hit && this.timeTeleporting >= DRAW_TIME_MS ? HIT_OPACITY : MISS_OPACITY;
    this.rayCurve.material.color.set(color);
    this.rayCurve.material.opacity = opacity;

    this.hitEntity.visible = this.hit;
    if (this.hit) {
      this.hitEntity.position.copy(this.hitPoint);
      this.hitEntity.matrixNeedsUpdate = true;

      const dRadii = this.data.outerRadius - this.data.hitCylinderRadius;
      const outerScale = (this.data.outerRadius - easeIn(percentToDraw) * dRadii) / this.data.outerRadius;
      this.outerTorus.scale.set(outerScale, outerScale, 1);
      this.outerTorus.matrixNeedsUpdate = true;

      const hitEntityOpacity = HIT_OPACITY * easeOutIn(percentToDraw);
      this.torus.material.opacity = hitEntityOpacity;
      this.cylinder.material.opacity = hitEntityOpacity;
    }
  },

  // TODO the use of toruses here is a bit wasteful.
  createHitEntity() {
    const data = this.data;

    // Parent.
    const hitEntity = new THREE.Group();

    // Torus.
    this.torus = new THREE.Mesh(
      new THREE.TorusBufferGeometry(data.hitCylinderRadius, 0.01, 16, 18, 360 * THREE.Math.DEG2RAD),
      new THREE.MeshBasicMaterial({
        color: data.hitCylinderColor,
        side: THREE.DoubleSide,
        transparent: true,
        toneMapped: false,
        depthTest: false
      })
    );
    this.torus.rotation.x = 90 * THREE.Math.DEG2RAD;
    hitEntity.add(this.torus);

    // Cylinder.
    this.cylinder = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(
        data.hitCylinderRadius,
        data.hitCylinderRadius,
        data.hitCylinderHeight,
        16,
        1,
        true
      ),
      new THREE.MeshBasicMaterial({
        color: data.hitCylinderColor,
        side: THREE.DoubleSide,
        map: CYLINDER_TEXTURE,
        toneMapped: false,
        transparent: true,
        depthTest: false
      })
    );
    this.cylinder.position.y = data.hitCylinderHeight / 2;
    // UV's for THREE Geometries assume flipY
    if (!CYLINDER_TEXTURE.flipY) {
      this.cylinder.rotation.z = 180 * THREE.Math.DEG2RAD;
    }
    hitEntity.add(this.cylinder);

    // create another torus for animating when the hit destination is ready to go
    this.outerTorus = new THREE.Mesh(
      new THREE.TorusBufferGeometry(data.outerRadius, 0.01, 16, 18, 360 * THREE.Math.DEG2RAD),
      new THREE.MeshBasicMaterial({
        color: data.hitCylinderColor,
        side: THREE.DoubleSide,
        opacity: HIT_OPACITY,
        transparent: true,
        depthTest: false
      })
    );
    this.outerTorus.rotation.x = 90 * THREE.Math.DEG2RAD;
    hitEntity.add(this.outerTorus);

    return hitEntity;
  }
});
