var invaderPos = new AFRAME.THREE.Vector3();
var bubblePos = new AFRAME.THREE.Vector3();

AFRAME.registerSystem("personal-space-bubble", {
  init() {
    this.invaders = [];
    this.bubbles = [];
  },

  registerBubble(el) {
    this.bubbles.push(el);
  },

  unregisterBubble(el) {
    var index = this.bubbles.indexOf(el);

    if (index !== -1) {
      this.bubbles.splice(index, 1);
    }
  },

  registerInvader(el) {
    var networkedEl = NAF.utils.getNetworkedEntity(el);
    var owner = NAF.utils.getNetworkOwner(networkedEl);

    if (owner !== NAF.clientId) {
      this.invaders.push(el);
    }
  },

  unregisterInvader(el) {
    var index = this.invaders.indexOf(el);

    if (index !== -1) {
      this.invaders.splice(index, 1);
    }
  },

  tick() {
    // Update matrix positions once for each space bubble and space invader
    for (var i = 0; i < this.bubbles.length; i++) {
      this.bubbles[i].object3D.updateMatrixWorld(true);
    }

    for (var i = 0; i < this.invaders.length; i++) {
      this.invaders[i].object3D.updateMatrixWorld(true);
    }

    // Loop through all of the space bubbles (usually one)
    for (var i = 0; i < this.bubbles.length; i++) {
      var bubble = this.bubbles[i];

      bubblePos.setFromMatrixPosition(bubble.object3D.matrixWorld);

      var radius = bubble.components["personal-space-bubble"].data.radius;
      var radiusSquared = radius * radius;

      // Hide the invader if inside the bubble
      for (var j = 0; j < this.invaders.length; j++) {
        var invader = this.invaders[j];

        invaderPos.setFromMatrixPosition(invader.object3D.matrixWorld);

        var distanceSquared = bubblePos.distanceTo(invaderPos);

        invader.object3D.visible = distanceSquared > radiusSquared;
      }
    }
  }
});

AFRAME.registerComponent("personal-space-invader", {
  init() {
    this.el.sceneEl.systems["personal-space-bubble"].registerInvader(this.el);
  },

  remove() {
    this.el.sceneEl.systems["personal-space-bubble"].unregisterInvader(this.el);
  }
});

AFRAME.registerComponent("personal-space-bubble", {
  schema: {
    radius: { type: "number", default: 0.8 }
  },
  init() {
    this.system.registerBubble(this.el);
  },

  remove() {
    this.system.unregisterBubble(this.el);
  }
});
