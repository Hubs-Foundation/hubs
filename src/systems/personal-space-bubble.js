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

  registerBubble(el) {
    this.bubbles.push(el);
  },

  unregisterBubble(el) {
    const index = this.bubbles.indexOf(el);

    if (index !== -1) {
      this.bubbles.splice(index, 1);
    }
  },

  registerInvader(el) {
    NAF.utils.getNetworkedEntity(el).then(networkedEl => {
      const owner = NAF.utils.getNetworkOwner(networkedEl);

      if (owner !== NAF.clientId) {
        this.invaders.push(el);
      }
    });
  },

  unregisterInvader(el) {
    const index = this.invaders.indexOf(el);

    if (index !== -1) {
      this.invaders.splice(index, 1);
    }
  },

  tick() {
    // Update matrix positions once for each space bubble and space invader
    for (let i = 0; i < this.bubbles.length; i++) {
      this.bubbles[i].object3D.updateMatrixWorld(true);
    }

    for (let i = 0; i < this.invaders.length; i++) {
      this.invaders[i].object3D.updateMatrixWorld(true);
    }

    // Loop through all of the space bubbles (usually one)
    for (let i = 0; i < this.bubbles.length; i++) {
      const bubble = this.bubbles[i];

      bubblePos.setFromMatrixPosition(bubble.object3D.matrixWorld);

      const bubbleRadius = bubble.components["personal-space-bubble"].data.radius;

      // Hide the invader if inside the bubble
      for (let j = 0; j < this.invaders.length; j++) {
        const invader = this.invaders[j];
        const invaderRaidus = invader.components["personal-space-invader"].data.radius;

        invaderPos.setFromMatrixPosition(invader.object3D.matrixWorld);

        const distanceSquared = bubblePos.distanceToSquared(invaderPos);
        const radius = bubbleRadius + invaderRaidus;

        invader.object3D.visible = distanceSquared > radius * radius;
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

AFRAME.registerComponent("personal-space-invader", {
  schema: {
    radius: { type: "number", default: 0.1 },
    debug: { default: false }
  },
  init() {
    const system = this.el.sceneEl.systems["personal-space-bubble"];
    system.registerInvader(this.el);
    if (system.data.debug || this.data.debug) {
      this.el.object3D.add(createSphereGizmo(this.data.radius));
    }
  },

  update() {
    this.radiusSquared = this.data.radius * this.data.radius;
  },

  remove() {
    this.el.sceneEl.systems["personal-space-bubble"].unregisterInvader(this.el);
  }
});

AFRAME.registerComponent("personal-space-bubble", {
  schema: {
    radius: { type: "number", default: 0.8 },
    debug: { default: false }
  },
  init() {
    this.system.registerBubble(this.el);
    if (this.system.data.debug || this.data.debug) {
      this.el.object3D.add(createSphereGizmo(this.data.radius));
    }
  },

  update() {
    this.radiusSquared = this.data.radius * this.data.radius;
  },

  remove() {
    this.system.unregisterBubble(this.el);
  }
});
