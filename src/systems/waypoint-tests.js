window.logWaypointInfo = function() {
  AFRAME.scenes[0].systems["hubs-systems"].waypointSystem.components.forEach(c => {
    console.log(c.el);
    console.log(c.data);
    if (NAF.utils.getNetworkedEntity(c.el)) {
      console.log("object creator is:", NAF.utils.getCreator(c.el));
      console.log("object owner is:", NAF.utils.getNetworkOwner(c.el));
      console.log("my client id is:", NAF.clientId);
    }
  });
};

export const DebugDrawRect = (function() {
  let c;
  return function DebugDrawRect(color) {
    if (!c) {
      c = document.createElement("canvas");
      c.style.zIndex = 10;
      c.style.position = "relative";
      document.body.prepend(c);
    }
    c.style.backgroundColor = color;
  };
})();

AFRAME.registerSystem("waypoint-test-spawning", {
  tick() {
    if (!window.TEST_WAYPOINTS_SPAWNING) return;
    window.TEST_WAYPOINTS_SPAWNING = false;
    console.log("TESTING WAYPOINT SPAWNING");
    const v = new THREE.Vector3();

    const entity01 = document.createElement("a-entity");
    entity01.setAttribute("networked", {
      template: "#waypoint-avatar",
      attachTemplateToLocal: false
      //      owner: "scene",
      // persistent: true
      //      networkId: MY_NETWORK_IDS++
    });
    entity01.setAttribute("waypoint", {
      canBeSpawnPoint: true,
      canBeOccupied: true,
      canBeClicked: false,
      willDisableMotion: false,
      willMaintainWorldUp: true
    });
    this.el.appendChild(entity01);
    entity01.object3D.position.set(5, 1.6, 0);
    entity01.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
    entity01.object3D.matrixNeedsUpdate = true;

    const entity02 = document.createElement("a-entity");
    entity02.setAttribute("waypoint", {
      canBeSpawnPoint: true,
      canBeOccupied: true,
      canBeClicked: false,
      willDisableMotion: false,
      willMaintainWorldUp: true
    });
    entity02.setAttribute("networked", {
      template: "#waypoint-avatar",
      attachTemplateToLocal: false
      //      owner: "scene",
      // persistent: true
      //      networkId: MY_NETWORK_IDS++
    });
    this.el.appendChild(entity02);
    entity02.object3D.position.set(0, 1.6, 5);
    entity02.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
    entity02.object3D.matrixNeedsUpdate = true;

    const entity04 = document.createElement("a-entity");
    entity04.setAttribute("waypoint", {
      canBeSpawnPoint: true,
      canBeOccupied: true,
      canBeClicked: false,
      willDisableMotion: false,
      willMaintainWorldUp: true
    });
    entity04.setAttribute("networked", {
      template: "#waypoint-avatar",
      attachTemplateToLocal: false
      //      owner: "scene",
      // persistent: true
      //      networkId: MY_NETWORK_IDS++
    });

    this.el.appendChild(entity04);
    entity04.object3D.position.set(-5, 1.6, 0);
    entity04.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), -Math.PI / 2);
    entity04.object3D.matrixNeedsUpdate = true;
  }
});
