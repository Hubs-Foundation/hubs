var posA = new AFRAME.THREE.Vector3();
var posB = new AFRAME.THREE.Vector3();

function distance(entityA, entityB) {
  entityA.object3D.getWorldPosition(posA);
  entityB.object3D.getWorldPosition(posB);
  return posA.distanceTo(posB);
}

AFRAME.registerSystem("personal-space-bubble", {
  init() {
    this.myEntities = [];
    this.entities = [];
  },

  registerEntity(el) {
    var networkedEl = NAF.utils.getNetworkedEntity(el);
    var owner = NAF.utils.getNetworkOwner(networkedEl);

    if (owner !== NAF.clientId) {
      this.entities.push(el);
    } else {
      this.myEntities.push(el);
    }
  },

  unregisterEntity(el) {
    var networkedEl = NAF.utils.getNetworkedEntity(el);
    var owner = NAF.utils.getNetworkOwner(networkedEl);

    if (owner !== NAF.clientId) {
      var index = this.entities.indexOf(el);
      this.entities.splice(index, 1);
    } else {
      var index = this.myEntities.indexOf(el);
      this.myEntities.splice(index, 1);
    }
  },

  tick() {
    for (var j = 0; j < this.entities.length; j++) {
      var otherEntity = this.entities[j];

      var visible = true;

      for (var i = 0; i < this.myEntities.length; i++) {
        var myEntity = this.myEntities[i];

        var d = distance(myEntity, otherEntity);

        if (d < myEntity.components["personal-space-bubble"].data.radius) {
          visible = false;
          break;
        }
      }

      otherEntity.object3D.visible = visible;
    }
  }
});

AFRAME.registerComponent("personal-space-bubble", {
  schema: {
    radius: { type: "number", default: 0.8 }
  },
  init() {
    this.system.registerEntity(this.el);
  },

  remove() {
    this.system.unregisterEntity(this.el);
  }
});
