window.logWaypointInfo = function(includeNetworkInfo) {
  AFRAME.scenes[0].systems["hubs-systems"].waypointSystem.components.forEach(c => {
    console.log(c.el);
    console.log(c.data);
    if (includeNetworkInfo && NAF.utils.getNetworkedEntity(c.el)) {
      console.log("object creator is:", NAF.utils.getCreator(c.el));
      console.log("object owner is:", NAF.utils.getNetworkOwner(c.el));
      console.log("my client id is:", NAF.clientId);
    }
  });
};

export const DebugDrawRect = (function() {
  let canvas;
  return function DebugDrawRect(color) {
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.style.zIndex = 10;
      canvas.style.position = "relative";
      document.body.prepend(canvas);
    }
    canvas.style.backgroundColor = color;
  };
})();

const ENABLE_TESTS = true;
if (ENABLE_TESTS) {
  AFRAME.registerSystem("waypoint-test-occupiable-spawn", {
    tick() {
      if (!window.TEST_WAYPOINTS_OCCUPIABLE_SPAWN) return;
      window.TEST_WAYPOINTS_OCCUPIABLE_SPAWN = false;
      console.log("CREATING OCCUPIABLE SPAWN POINTS");
      const v = new THREE.Vector3();

      const entity01 = document.createElement("a-entity");
      entity01.setAttribute("networked", {
        template: "#template-waypoint-avatar,
        attachTemplateToLocal: false
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
      entity01.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), -Math.PI / 2);
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
        template: "#template-waypoint-avatar,
        attachTemplateToLocal: false
      });
      this.el.appendChild(entity02);
      entity02.object3D.position.set(0, 1.6, 5);
      entity02.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
      entity02.object3D.matrixNeedsUpdate = true;

      const entity03 = document.createElement("a-entity");
      entity03.setAttribute("waypoint", {
        canBeSpawnPoint: true,
        canBeOccupied: true,
        canBeClicked: false,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      entity03.setAttribute("networked", {
        template: "#template-waypoint-avatar,
        attachTemplateToLocal: false
      });

      this.el.appendChild(entity03);
      entity03.object3D.position.set(-5, 1.6, 0);
      entity03.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
      entity03.object3D.matrixNeedsUpdate = true;
    }
  });

  AFRAME.registerSystem("waypoint-test-clickable-unoccupiable", {
    tick() {
      if (!window.TEST_WAYPOINTS_CLICKABLE_UNOCCUPIABLE) return;
      window.TEST_WAYPOINTS_CLICKABLE_UNOCCUPIABLE = false;
      console.log("CREATING CLICKABLE, UNOCCUPIABLE WAYPOINTS");
      const v = new THREE.Vector3();

      const entity01 = document.createElement("a-entity");
      entity01.setAttribute("networked", {
        template: "#template-waypoint-avatar,
        attachTemplateToLocal: false
      });
      entity01.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: false,
        canBeClicked: true,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      this.el.appendChild(entity01);
      entity01.object3D.position.set(5, 1.6, 0);
      entity01.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), -Math.PI / 2);
      entity01.object3D.matrixNeedsUpdate = true;

      const entity02 = document.createElement("a-entity");
      entity02.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: false,
        canBeClicked: true,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      entity02.setAttribute("networked", {
        template: "#template-waypoint-avatar,
        attachTemplateToLocal: false
      });
      this.el.appendChild(entity02);
      entity02.object3D.position.set(0, 1.6, 5);
      entity02.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
      entity02.object3D.matrixNeedsUpdate = true;

      const entity03 = document.createElement("a-entity");
      entity03.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: false,
        canBeClicked: true,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      entity03.setAttribute("networked", {
        template: "#template-waypoint-avatar,
        attachTemplateToLocal: false
      });

      this.el.appendChild(entity03);
      entity03.object3D.position.set(-5, 1.6, 0);
      entity03.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
      entity03.object3D.matrixNeedsUpdate = true;
    }
  });

  AFRAME.registerSystem("waypoint-test-clickable-occupiable", {
    tick() {
      if (!window.TEST_WAYPOINTS_CLICKABLE_OCCUPIABLE) return;
      window.TEST_WAYPOINTS_CLICKABLE_OCCUPIABLE = false;
      console.log("CREATING CLICKABLE, OCCUPIABLE WAYPOINTS");
      const v = new THREE.Vector3();

      const entity01 = document.createElement("a-entity");
      entity01.setAttribute("networked", {
        template: "#template-waypoint-avatar,
        attachTemplateToLocal: false
      });
      entity01.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: true,
        canBeClicked: true,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      this.el.appendChild(entity01);
      entity01.object3D.position.set(5, 1.6, 0);
      entity01.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), -Math.PI / 2);
      entity01.object3D.matrixNeedsUpdate = true;

      const entity02 = document.createElement("a-entity");
      entity02.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: true,
        canBeClicked: true,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      entity02.setAttribute("networked", {
        template: "#template-waypoint-avatar,
        attachTemplateToLocal: false
      });
      this.el.appendChild(entity02);
      entity02.object3D.position.set(0, 1.6, 5);
      entity02.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
      entity02.object3D.matrixNeedsUpdate = true;

      const entity03 = document.createElement("a-entity");
      entity03.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: true,
        canBeClicked: true,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      entity03.setAttribute("networked", {
        template: "#template-waypoint-avatar,
        attachTemplateToLocal: false
      });

      this.el.appendChild(entity03);
      entity03.object3D.position.set(-5, 1.6, 0);
      entity03.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
      entity03.object3D.matrixNeedsUpdate = true;
    }
  });

  AFRAME.registerSystem("waypoint-test-clickable-motion-lock", {
    tick() {
      if (!window.TEST_WAYPOINTS_CLICKABLE_MOTION_LOCK) return;
      window.TEST_WAYPOINTS_CLICKABLE_MOTION_LOCK = false;
      console.log("CREATING CLICKABLE, MOTION_LOCKING WAYPOINTS");
      const v = new THREE.Vector3();

      const entity01 = document.createElement("a-entity");
      entity01.setAttribute("networked", {
        template: "#template-waypoint-avatar,
        attachTemplateToLocal: false
      });
      entity01.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: false,
        canBeClicked: true,
        willDisableMotion: true,
        willMaintainWorldUp: true
      });
      this.el.appendChild(entity01);
      entity01.object3D.position.set(5, 1.6, 0);
      entity01.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), -Math.PI / 2);
      entity01.object3D.matrixNeedsUpdate = true;

      const entity02 = document.createElement("a-entity");
      entity02.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: false,
        canBeClicked: true,
        willDisableMotion: true,
        willMaintainWorldUp: true
      });
      entity02.setAttribute("networked", {
        template: "#template-waypoint-avatar,
        attachTemplateToLocal: false
      });
      this.el.appendChild(entity02);
      entity02.object3D.position.set(0, 1.6, 5);
      entity02.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
      entity02.object3D.matrixNeedsUpdate = true;

      const entity03 = document.createElement("a-entity");
      entity03.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: false,
        canBeClicked: true,
        willDisableMotion: true,
        willMaintainWorldUp: true
      });
      entity03.setAttribute("networked", {
        template: "#template-waypoint-avatar,
        attachTemplateToLocal: false
      });

      this.el.appendChild(entity03);
      entity03.object3D.position.set(-5, 1.6, 0);
      entity03.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
      entity03.object3D.matrixNeedsUpdate = true;
    }
  });
}
