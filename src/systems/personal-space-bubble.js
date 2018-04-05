const invaderPos = new AFRAME.THREE.Vector3();
const bubblePos = new AFRAME.THREE.Vector3();

AFRAME.registerSystem("personal-space-bubble", {
  schema: {
    debug: { default: false }
  },

  init() {
    this.invaders = [];
    this.bubbles = [];
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

  tick() {
    // Update matrix positions once for each space bubble and space invader
    for (let i = 0; i < this.bubbles.length; i++) {
      this.bubbles[i].el.object3D.updateMatrixWorld(true);
    }

    for (let i = 0; i < this.invaders.length; i++) {
      this.invaders[i].el.object3D.updateMatrixWorld(true);
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
AFRAME.registerComponent("space-invader-mesh", {
  schema: {
    meshSelector: { type: "string" }
  },
  init() {
    this.targetMesh = this.el.querySelector(this.data.meshSelector).object3DMap.skinnedmesh;
    console.log("target", this.targetMesh);
  }
});

function findInvaderMesh(entity) {
  while (entity && !(entity.components && entity.components["space-invader-mesh"])) {
    entity = entity.parentNode;
  }
  return entity && entity.components["space-invader-mesh"].targetMesh;
}

AFRAME.registerComponent("personal-space-invader", {
  schema: {
    radius: { type: "number", default: 0.1 },
    useMaterial: { default: false },
    debug: { default: false }
  },
  init() {
    const system = this.el.sceneEl.systems["personal-space-bubble"];
    system.registerInvader(this);
    if (system.data.debug || this.data.debug) {
      this.el.object3D.add(createSphereGizmo(this.data.radius));
    }
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
  },

  remove() {
    this.el.sceneEl.systems["personal-space-bubble"].unregisterInvader(this);
  },

  setInvading(invading) {
    if (this.targetMaterial) {
      this.targetMaterial.opacity = invading ? 0.3 : 1;
      this.targetMaterial.transparent = invading;
    } else {
      this.el.object3D.visible = !invading;
    }
    this.invading = invading;
  }
});

AFRAME.registerComponent("personal-space-bubble", {
  schema: {
    radius: { type: "number", default: 0.8 },
    debug: { default: false }
  },
  init() {
    this.system.registerBubble(this);
    if (this.system.data.debug || this.data.debug) {
      this.el.object3D.add(createSphereGizmo(this.data.radius));
    }
  },

  update() {
    this.radiusSquared = this.data.radius * this.data.radius;
  },

  remove() {
    this.system.unregisterBubble(this);
  }
});
