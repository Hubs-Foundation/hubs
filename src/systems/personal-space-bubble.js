/* global TWEEN */
const invaderPos = new AFRAME.THREE.Vector3();
const bubblePos = new AFRAME.THREE.Vector3();

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

  update(oldData) {
    for (let i = 0; i < this.bubbles.length; i++) {
      this.bubbles[i].updateDebug();
      if (oldData.enabled !== this.data.enabled) {
        this.bubbles[i].showStateChange(this.data.enabled);
      }
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
      let bubbleInvaded = false;

      bubblePos.setFromMatrixPosition(bubble.el.object3D.matrixWorld);

      // Hide the invader if inside the bubble
      for (let j = 0; j < this.invaders.length; j++) {
        const invader = this.invaders[j];

        invaderPos.setFromMatrixPosition(invader.el.object3D.matrixWorld);

        const distanceSquared = bubblePos.distanceToSquared(invaderPos);
        const radiusSum = bubble.data.radius + invader.data.radius;
        if (distanceSquared < radiusSum * radiusSum) {
          invader.setInvading(true);
          bubbleInvaded = true;
        }
      }

      bubble.setInvading(bubbleInvaded);
    }
  }
});

function createSphereGizmo(radius) {
  const geometry = new THREE.WireframeGeometry(new THREE.SphereBufferGeometry(radius, 10, 10));
  const gizmo = new THREE.LineSegments(geometry);
  gizmo.material.opacity = 0.5;
  gizmo.material.transparent = true;
  return gizmo;
}

// TODO: we need to come up with a more generic way of doing this as this is very specific to our avatars.
AFRAME.registerComponent("space-invader-mesh", {
  schema: {
    meshSelector: { type: "string" }
  },
  init() {
    this.targetMesh = this.el.querySelector(this.data.meshSelector).object3DMap.skinnedmesh;
  }
});

function findInvaderMesh(entity) {
  while (entity && !(entity.components && entity.components["space-invader-mesh"])) {
    entity = entity.parentNode;
  }
  return entity && entity.components["space-invader-mesh"].targetMesh;
}

const DEBUG_OBJ = "psb-debug";

AFRAME.registerComponent("personal-space-invader", {
  schema: {
    radius: { type: "number", default: 0.1 },
    useMaterial: { default: false },
    debug: { default: false },
    invadingOpacity: { default: 0.1 }
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

// TODO come up with better visuals than a wireframe sphere
function createBubbleObject(radius) {
  const material = new THREE.LineBasicMaterial({ color: 0x2f80ed });
  const geometry = new THREE.WireframeGeometry(new THREE.SphereBufferGeometry(radius, 20, 20));
  const sphere = new THREE.LineSegments(geometry, material);
  material.transparent = true;
  return sphere;
}

AFRAME.registerComponent("personal-space-bubble", {
  schema: {
    radius: { type: "number", default: 0.8 },
    invadeIndicatorCooldown: { type: "number", default: 5000 },
    debug: { default: false }
  },
  init() {
    this.bubble = createBubbleObject(this.data.radius);
    this.el.setObject3D("bubble", this.bubble);

    // Only shown when state is toggled or personal space is invaded
    this.setBubbleVisibility(false);

    this.bubbleOffTween = new TWEEN.Tween(this.bubble.scale)
      .to({ x: 0.001, y: 0.001, z: 0.001 }, 500)
      .easing(TWEEN.Easing.Quadratic.In)
      .onComplete(() => (this.bubble.visible = false));

    this.fadeOutTween = new TWEEN.Tween(this.bubble.material)
      .to({ opacity: 0 }, 250)
      .delay(300)
      .onComplete(() => (this.bubble.visible = false));

    this.bubbleOnTween = new TWEEN.Tween(this.bubble.scale)
      .to({ x: 1, y: 1, z: 1 }, 600)
      .easing(TWEEN.Easing.Elastic.InOut)
      .chain(this.fadeOutTween);

    this.lastUninvadeTime = 0;

    this.system.registerBubble(this);
  },

  setBubbleVisibility(visible) {
    this.bubble.visible = visible;
    this.bubble.material.opacity = visible ? 0.5 : 0.0;
  },

  showStateChange(enabled) {
    // Bubble will be hidden again at the end of on/off tweens
    this.setBubbleVisibility(true);
    if (enabled) {
      this.bubbleOffTween.stop();
      this.bubbleOnTween.start();
    } else {
      this.bubbleOnTween.stop();
      this.bubbleOffTween.start();
    }
  },

  setInvading(invading) {
    const now = performance.now();
    // Flash the bubble breifly on invading if it has been long enough since the last bubble invasion
    if (invading && !this.wasInvading && now - this.lastUninvadeTime >= this.data.invadeIndicatorCooldown) {
      this.fadeOutTween.stop();
      this.setBubbleVisibility(true);
      this.fadeOutTween.start();
    } else if (!invading && this.wasInvading) {
      this.lastUninvadeTime = now;
    }
    this.wasInvading = invading;
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
