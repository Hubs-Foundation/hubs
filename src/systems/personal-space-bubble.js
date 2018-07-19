const invaderPos = new AFRAME.THREE.Vector3();
const bubblePos = new AFRAME.THREE.Vector3();

/**
 * Iterates through bubbles and invaders on every tick and sets invader state accordingly.
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

    this.el.addEventListener("action_space_bubble", () => {
      this.el.setAttribute("personal-space-bubble", { enabled: !this.data.enabled });
    });
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
    if (!this.data.enabled) return;

    // precondition for this stuff -- the bubbles and invaders need updated world matrices.
    // right now this is satisfied because we update the world matrices in the character controller

    for (let i = 0; i < this.invaders.length; i++) {
      this.invaders[i].setInvading(false);
    }

    // Loop through all of the space bubbles (usually one)
    for (let i = 0; i < this.bubbles.length; i++) {
      const bubble = this.bubbles[i];

      bubblePos.setFromMatrixPosition(bubble.el.object3D.matrixWorld);

      // Hide the invader if inside the bubble
      for (let j = 0; j < this.invaders.length; j++) {
        const invader = this.invaders[j];

        invaderPos.setFromMatrixPosition(invader.el.object3D.matrixWorld);

        const distanceSquared = bubblePos.distanceToSquared(invaderPos);
        const radiusSum = bubble.data.radius + invader.data.radius;
        if (distanceSquared < radiusSum * radiusSum) {
          invader.setInvading(true);
        }
      }
    }
  }
});

function createSphereGizmo(radius) {
  const geometry = new THREE.SphereBufferGeometry(radius, 10, 10);
  const wireframe = new THREE.WireframeGeometry(geometry);
  const line = new THREE.LineSegments(wireframe);
  line.material.opacity = 0.5;
  line.material.transparent = true;
  return line;
}

// TODO: we need to come up with a more generic way of doing this as this is very specific to our avatars.
/**
 * Specifies a mesh associated with an invader.
 * @namespace avatar/personal-space-bubble
 * @component space-invader-mesh
 */
AFRAME.registerComponent("space-invader-mesh", {
  schema: {
    meshName: { type: "string" }
  },
  update() {
    this.targetMesh = this.el.object3D.getObjectByName(this.data.meshName);
  }
});

function findInvaderMesh(entity) {
  while (entity && !(entity.components && entity.components["space-invader-mesh"])) {
    entity = entity.parentNode;
  }
  return entity && entity.components["space-invader-mesh"].targetMesh;
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
      const mesh = findInvaderMesh(this.el);
      if (mesh) {
        this.targetMaterial = mesh.material;
      }
    }
    this.invading = false;
  },

  update() {
    this.radiusSquared = this.data.radius * this.data.radius;
    this.updateDebug();
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
    if (this.targetMaterial) {
      this.targetMaterial.opacity = invading ? this.data.invadingOpacity : 1;
      this.targetMaterial.transparent = invading;
    } else {
      this.el.object3D.visible = !invading;
    }
    this.invading = invading;
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
