const CYLINDER_TEXTURE =
  "data:image/png;base64,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";

import { SOUND_TELEPORT_START, SOUND_TELEPORT_END } from "../systems/sound-effects-system";

function easeIn(t) {
  return t * t;
}

function easeOutIn(t) {
  if (t < 0.5) return 0.5 * ((t = t * 2 - 1) * t * t + 1);
  return 0.5 * (t = t * 2 - 1) * t * t + 0.5;
}

const RayCurve = function(numPoints, width) {
  this.geometry = new THREE.BufferGeometry();
  this.vertices = new Float32Array(numPoints * 3 * 2);
  this.uvs = new Float32Array(numPoints * 2 * 2);
  this.width = width;

  this.geometry.addAttribute("position", new THREE.BufferAttribute(this.vertices, 3).setDynamic(true));

  this.material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    transparent: true
  });

  this.mesh = new THREE.Mesh(this.geometry, this.material);
  this.mesh.drawMode = THREE.TriangleStripDrawMode;

  this.mesh.frustumCulled = false;
  this.mesh.vertices = this.vertices;

  this.direction = new THREE.Vector3();
  this.numPoints = numPoints;
};

RayCurve.prototype = {
  setDirection: function(direction) {
    const UP = new THREE.Vector3(0, 1, 0);
    this.direction
      .copy(direction)
      .cross(UP)
      .normalize()
      .multiplyScalar(this.width / 2);
  },

  setWidth: function(width) {
    this.width = width;
  },

  setPoint: (function() {
    const posA = new THREE.Vector3();
    const posB = new THREE.Vector3();

    return function(i, point) {
      posA.copy(point).add(this.direction);
      posB.copy(point).sub(this.direction);

      let idx = 2 * 3 * i;
      this.vertices[idx++] = posA.x;
      this.vertices[idx++] = posA.y;
      this.vertices[idx++] = posA.z;

      this.vertices[idx++] = posB.x;
      this.vertices[idx++] = posB.y;
      this.vertices[idx++] = posB.z;

      this.geometry.attributes.position.needsUpdate = true;
    };
  })()
};

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

function getMeshes(collisionEntities) {
  return collisionEntities
    .map(function(entity) {
      return entity.getObject3D("mesh");
    })
    .filter(function(n) {
      return n;
    });
}

const MISS_OPACITY = 0.1;
const HIT_OPACITY = 0.3;
const MISS_COLOR = 0xff0000;
const HIT_COLOR = 0x00ff00;
const FORWARD = new THREE.Vector3(0, 0, -1);
const LANDING_NORMAL = new THREE.Vector3(0, 1, 0);
const MAX_LANDING_ANGLE = 45;
const DRAW_TIME_MS = 400;
const q = new THREE.Quaternion();
const vecHelper = new THREE.Vector3();

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
    this.isTeleporting = false;
    this.rayCurve = new RayCurve(20, 0.025);
    this.rayCurve.mesh.visible = false;
    this.teleportEntity = document.createElement("a-entity");
    this.teleportEntity.setObject3D("mesh", this.rayCurve.mesh);
    this.el.sceneEl.appendChild(this.teleportEntity);

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
    this.hitEntity.object3D.visible = false;
    this.el.sceneEl.appendChild(this.hitEntity);
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
    if (!this.el.sceneEl.is("entered")) return;
    const sfx = this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem;
    const userinput = AFRAME.scenes[0].systems.userinput;
    const { start, confirm, speed } = this.data;
    const object3D = this.el.object3D;

    if (!this.isTeleporting && userinput.get(start)) {
      this.isTeleporting = true;
      this.timeTeleporting = 0;
      this.hit = false;
      this.rayCurve.mesh.visible = true;
      this.rayCurve.mesh.updateMatrixWorld();
      this.rayCurve.mesh.material.opacity = MISS_OPACITY;
      this.rayCurve.mesh.material.color.set(MISS_COLOR);
      this.rayCurve.mesh.material.needsUpdate = true;
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
      this.hitEntity.setAttribute("visible", false);
      this.isTeleporting = false;
      this.rayCurve.mesh.visible = false;

      if (this.teleportingSound) {
        this.stopPlayingTeleportSound();
      }

      if (!this.hit || this.timeTeleporting < DRAW_TIME_MS) {
        return;
      }

      this.characterController =
        this.characterController || document.getElementById("avatar-rig").components["character-controller"];
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
    this.v0.copy(this.direction).multiplyScalar(speed);

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

    this.hitEntity.setAttribute("visible", this.hit);
    if (this.hit) {
      this.hitEntity.setAttribute("position", this.hitPoint);
      this.hitEntity.object3D.traverse(o => {
        o.matrixNeedsUpdate = true;
      });
      const hitEntityOpacity = HIT_OPACITY * easeOutIn(percentToDraw);
      const dRadii = this.data.outerRadius - this.data.hitCylinderRadius;
      const outerScale = (this.data.outerRadius - easeIn(percentToDraw) * dRadii) / this.data.outerRadius;
      this.outerTorus.object3D.scale.set(outerScale, outerScale, 1);
      this.torus.setAttribute("material", "opacity", hitEntityOpacity);
      this.cylinder.setAttribute("material", "opacity", hitEntityOpacity);
    }
  },

  createHitEntity() {
    const data = this.data;

    // Parent.
    const hitEntity = document.createElement("a-entity");
    hitEntity.className = "hitEntity";

    // Torus.
    this.torus = document.createElement("a-entity");
    this.torus.setAttribute("geometry", {
      primitive: "torus",
      radius: data.hitCylinderRadius,
      radiusTubular: 0.01,
      segmentsRadial: 16,
      segmentsTubular: 18
    });
    this.torus.setAttribute("rotation", { x: 90, y: 0, z: 0 });
    this.torus.setAttribute("material", {
      shader: "flat",
      color: data.hitCylinderColor,
      side: "double",
      depthTest: false
    });
    hitEntity.appendChild(this.torus);

    // Cylinder.
    this.cylinder = document.createElement("a-entity");
    this.cylinder.setAttribute("position", { x: 0, y: data.hitCylinderHeight / 2, z: 0 });
    if (window.createImageBitmap !== undefined) {
      this.cylinder.setAttribute("rotation", { x: 0, y: 0, z: 180 });
    }
    this.cylinder.setAttribute("geometry", {
      primitive: "cylinder",
      segmentsHeight: 1,
      radius: data.hitCylinderRadius,
      height: data.hitCylinderHeight,
      openEnded: true
    });
    this.cylinder.setAttribute("material", {
      shader: "flat",
      color: data.hitCylinderColor,
      side: "double",
      src: CYLINDER_TEXTURE,
      transparent: true,
      depthTest: false
    });
    hitEntity.appendChild(this.cylinder);

    // create another torus for animating when the hit destination is ready to go
    this.outerTorus = document.createElement("a-entity");
    this.outerTorus.setAttribute("geometry", {
      primitive: "torus",
      radius: data.outerRadius,
      radiusTubular: 0.01,
      segmentsRadial: 16,
      segmentsTubular: 18
    });
    this.outerTorus.setAttribute("rotation", { x: 90, y: 0, z: 0 });
    this.outerTorus.setAttribute("material", {
      shader: "flat",
      color: data.hitCylinderColor,
      side: "double",
      opacity: HIT_OPACITY,
      depthTest: false
    });
    this.outerTorus.setAttribute("id", "outerTorus");
    hitEntity.appendChild(this.outerTorus);

    return hitEntity;
  }
});
