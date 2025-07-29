import { hasComponent } from "bitecs";
import { IgnoreSpaceBubble } from "../bit-components";
import { forEachMaterial } from "../utils/material-utils";
import qsTruthy from "../utils/qs_truthy";
import traverseFilteredSubtrees from "../utils/traverseFilteredSubtrees";

const invaderPos = new THREE.Vector3();
const bubblePos = new THREE.Vector3();
const isDebug = qsTruthy("debug");
const isThisMobileVR = AFRAME.utils.device.isMobileVR();

/**
 * Updates invaders every tick, doing one per frame on mobile VR.
 * testing multiline things
 * @namespace avatar/personal-space-bubble
 * @system personal-space-bubble
 */
AFRAME.registerSystem("personal-space-bubble", {
  schema: {
    debug: { default: false },
    enabled: { default: true }
  },

  init() {
    this.invaders = [];
    this.bubbles = [];
    this.tickCount = 0;
    this._updateInvaders = this._updateInvaders.bind(this);
  },

  registerBubble(bubble) {
    this.bubbles.push(bubble);
  },

  unregisterBubble(bubble) {
    const index = this.bubbles.indexOf(bubble);

    if (index !== -1) {
      this.bubbles.splice(index, 1);
    }
  },

  registerInvader(invader) {
    NAF.utils.getNetworkedEntity(invader.el).then(networkedEl => {
      const owner = NAF.utils.getNetworkOwner(networkedEl);

      if (owner !== NAF.clientId) {
        this.invaders.push(invader);
      }
    });
  },

  unregisterInvader(invader) {
    const index = this.invaders.indexOf(invader);

    if (index !== -1) {
      this.invaders.splice(index, 1);
    }
  },

  update() {
    for (let i = 0; i < this.bubbles.length; i++) {
      this.bubbles[i].updateDebug();
    }

    for (let i = 0; i < this.invaders.length; i++) {
      this.invaders[i].updateDebug();
      if (!this.data.enabled) {
        this.invaders[i].setInvading(false);
      }
    }

    if (this.data.enabled) {
      this.el.addState("spacebubble");
    } else {
      this.el.removeState("spacebubble");
    }
  },

  tick() {
    this._updateInvaders();
    this.tickCount++;
  },

  _updateInvaders: (function () {
    const tempInvasionFlags = [];

    const setInvaderFlag = (i, invaders, bubble) => {
      // Hide the invader if inside the bubble
      const invader = invaders[i];
      invaderPos.setFromMatrixPosition(invader.el.object3D.matrixWorld);

      const distanceSquared = bubblePos.distanceToSquared(invaderPos);
      const radiusSum = bubble.data.radius + invader.data.radius;

      if (distanceSquared < radiusSum * radiusSum) {
        tempInvasionFlags[i] = true;
      }
    };

    const flushInvadingFlagsForIndex = (i, invaders) => {
      if (invaders[i].invading !== tempInvasionFlags[i]) {
        invaders[i].setInvading(tempInvasionFlags[i]);
      }
    };

    return function () {
      if (!this.data.enabled) return;
      if (this.invaders.length === 0) return;

      tempInvasionFlags.length = 0;

      // precondition for this stuff -- the bubbles and invaders need updated world matrices.
      // right now this is satisfied because we update the world matrices in the character controller
      for (let i = 0; i < this.invaders.length; i++) {
        this.invaders[i].el.object3D.updateMatrices(); // We read matrixWorld below, update matrices here
        tempInvasionFlags[i] = false;
      }

      // Loop through all of the space bubbles (usually one)
      for (let i = 0; i < this.bubbles.length; i++) {
        const bubble = this.bubbles[i];

        bubble.el.object3D.updateMatrices();
        bubblePos.setFromMatrixPosition(bubble.el.object3D.matrixWorld);

        if (!isThisMobileVR) {
          for (let j = 0; j < this.invaders.length; j++) {
            setInvaderFlag(j, this.invaders, bubble);
          }
        } else {
          // Optimization: update one invader per frame on mobile VR
          setInvaderFlag(this.tickCount % this.invaders.length, this.invaders, bubble);
        }
      }

      if (!isThisMobileVR) {
        for (let i = 0; i < this.invaders.length; i++) {
          flushInvadingFlagsForIndex(i, this.invaders);
        }
      } else {
        flushInvadingFlagsForIndex(this.tickCount % this.invaders.length, this.invaders);
      }
    };
  })()
});

function createSphereGizmo(radius) {
  const geometry = new THREE.SphereBufferGeometry(radius, 10, 10);
  const wireframe = new THREE.WireframeGeometry(geometry);
  const line = new THREE.LineSegments(wireframe);
  line.material.opacity = 0.5;
  line.material.transparent = true;
  return line;
}

function getGLTFModelRoot(entity) {
  while (entity && !(entity.components && entity.components["gltf-model-plus"])) {
    entity = entity.parentNode;
  }

  return entity;
}

const DEBUG_OBJ = "psb-debug";

/**
 * Represents an entity that can invade a personal space bubble
 * @namespace avatar/personal-space-bubble
 * @component personal-space-invader
 */
AFRAME.registerComponent("personal-space-invader", {
  schema: {
    radius: { type: "number", default: 0.1 },
    useMaterial: { default: false },
    debug: { default: false },
    invadingOpacity: { default: 0.3 }
  },

  init() {
    const system = this.el.sceneEl.systems["personal-space-bubble"];
    system.registerInvader(this);

    if (this.data.useMaterial) {
      this.gltfRootEl = getGLTFModelRoot(this.el);
    }

    this.invading = false;
    this.alwaysHidden = false;
  },

  update() {
    this.radiusSquared = this.data.radius * this.data.radius;
    this.updateDebug();
  },

  // Allow external callers to tell this invader to always hide this element, regardless of invasion state
  setAlwaysHidden(alwaysHidden) {
    this.alwaysHidden = alwaysHidden;
    this.applyInvasionToMesh(this.invading);
  },

  updateDebug() {
    const system = this.el.sceneEl.systems["personal-space-bubble"];
    if (system.data.debug || this.data.debug) {
      !this.el.object3DMap[DEBUG_OBJ] && this.el.setObject3D(DEBUG_OBJ, createSphereGizmo(this.data.radius));
    } else if (this.el.object3DMap[DEBUG_OBJ]) {
      this.el.removeObject3D(DEBUG_OBJ);
    }
  },

  remove() {
    this.el.sceneEl.systems["personal-space-bubble"].unregisterInvader(this);
  },

  setInvading(invading) {
    if (this.invading === invading) return;

    this.applyInvasionToMesh(invading);
    this.invading = invading;
  },

  disable() {
    if (this.invading) {
      this.applyInvasionToMesh(false);
    }

    this.disabled = true;
  },

  enable() {
    this.disabled = false;
    this.applyInvasionToMesh(this.invading);
  },

  applyInvasionToMesh(invading) {
    if (this.disabled) return;

    // Note: Model isn't loaded on init because this object is inflated before the root is.
    // object3DMap.mesh is not initially set and must be checked before traversing.
    if (this.gltfRootEl && this.gltfRootEl.object3DMap.mesh && !this.alwaysHidden) {
      traverseFilteredSubtrees(this.gltfRootEl.object3DMap.mesh, obj => {
        // Prevents changing the opacity of ui elements
        if (obj.el && hasComponent(APP.world, IgnoreSpaceBubble, obj.el.eid)) {
          // Skip all objects under this branch by returning false
          return false;
        }

        if (!obj.material) {
          return;
        }

        forEachMaterial(obj, material => {
          let originalProps = material.userData.originalProps;

          if (!material.userData.originalProps) {
            originalProps = material.userData.originalProps = {
              opacity: material.opacity,
              transparent: material.transparent,
              format: material.format,
              blending: material.blending,
              side: material.side
            };
          }

          // Note: Sharing materials will cause all objects with the material to turn transparent / opaque
          // This is generally fine for avatars since a material will only be shared within a glTF model,
          // not across avatars in the room.
          material.opacity = invading ? this.data.invadingOpacity : originalProps.opacity;
          material.transparent = invading || originalProps.transparent;

          // Note: Since ThreeJS 0.132 the default format for GLTF imported opaque materials is RGBFormat
          // so we need to switch before enabling transparency.
          material.format = invading ? THREE.RGBAFormat : originalProps.format;
          material.blending = invading ? THREE.NormalBlending : originalProps.blending;
          // This shouldn't be necessary but for some reason transparency doens't work on some models if they are single sided.
          material.side = invading ? THREE.DoubleSide : originalProps.side;
        });
      });
    } else {
      this.el.object3D.visible = !invading && !this.alwaysHidden;
    }
  }
});

/**
 * Represents a personal space bubble on an entity.
 * @namespace avatar/personal-space-bubble
 * @component personal-space-bubble
 */
AFRAME.registerComponent("personal-space-bubble", {
  schema: {
    radius: { type: "number", default: 0.8 },
    debug: { default: false }
  },
  init() {
    this.system.registerBubble(this);
  },

  update() {
    this.radiusSquared = this.data.radius * this.data.radius;
    this.updateDebug();
  },

  updateDebug() {
    if (!isDebug) return;

    if (this.system.data.debug || this.data.debug) {
      !this.el.object3DMap[DEBUG_OBJ] && this.el.setObject3D(DEBUG_OBJ, createSphereGizmo(this.data.radius));
    } else if (this.el.object3DMap[DEBUG_OBJ]) {
      this.el.removeObject3D(DEBUG_OBJ);
    }
  },

  remove() {
    this.system.unregisterBubble(this);
  }
});
