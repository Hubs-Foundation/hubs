const TEST_WAYPOINTS_OCCUPYING = false;
const TEST_WAYPOINTS_CLICKING = false;

const DEBUG = true;

let c;
export function DEBUG_RENDER_COLORED_RECTANGLE(color) {
  if (!DEBUG) return;
  if (!c) {
    c = document.createElement("canvas");
    c.style.zIndex = 10;
    c.style.position = "relative";
    document.body.prepend(c);
  }
  c.style.backgroundColor = color;
}

AFRAME.registerSystem("waypoint-test-spawning", {
  tick() {
    if (!window.TEST_WAYPOINTS_SPAWNING) return;
    window.TEST_WAYPOINTS_SPAWNING = false;
    console.log("TESTING WAYPOINT SPAWNING");
    const v = new THREE.Vector3();

    const entity01 = document.createElement("a-entity");
    entity01.setAttribute("waypoint", {
      canBeSpawnPoint: true,
      canBeOccupied: true,
      canBeClicked: false,
      willDisableMotion: false,
      willMaintainWorldUp: true
    });
    entity01.setAttribute("networked", { template: "#waypoint-avatar", attachTemplateToLocal: false });
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
    entity02.setAttribute("networked", { template: "#waypoint-avatar", attachTemplateToLocal: false });
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
    entity04.setAttribute("networked", { template: "#waypoint-avatar", attachTemplateToLocal: false });
    this.el.appendChild(entity04);
    entity04.object3D.position.set(-5, 1.6, 0);
    entity04.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), -Math.PI / 2);
    entity04.object3D.matrixNeedsUpdate = true;

    const entity03 = document.createElement("a-entity");
    entity03.setAttribute("waypoint", {
      canBeSpawnPoint: true,
      canBeOccupied: true,
      canBeClicked: false,
      willDisableMotion: false,
      willMaintainWorldUp: true
    });
    entity03.setAttribute("networked", { template: "#waypoint-avatar", attachTemplateToLocal: false });
    this.el.appendChild(entity03);
    entity03.object3D.position.set(0, 1.6, -5);
    entity03.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
    entity03.object3D.matrixNeedsUpdate = true;
  }
});

if (TEST_WAYPOINTS_OCCUPYING) {
  AFRAME.registerSystem("test-waypoint-occupying", {
    init() {
      console.log("TESTING OCCUPIABLE WAYPOINTS");
      const v = new THREE.Vector3();

      const entity01 = document.createElement("a-entity");
      this.el.appendChild(entity01);
      entity01.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: true,
        canBeClicked: true,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      entity01.object3D.position.set(5, 1.6, 0);
      entity01.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
      entity01.object3D.matrixNeedsUpdate = true;

      const entity02 = document.createElement("a-entity");
      this.el.appendChild(entity02);
      entity02.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: true,
        canBeClicked: true,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      entity02.object3D.position.set(0, 1.6, 5);
      entity02.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
      entity02.object3D.matrixNeedsUpdate = true;

      const entity04 = document.createElement("a-entity");
      this.el.appendChild(entity04);
      entity04.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: true,
        canBeClicked: true,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      entity04.object3D.position.set(-5, 1.6, 0);
      entity04.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), -Math.PI / 2);
      entity04.object3D.matrixNeedsUpdate = true;

      const entity03 = document.createElement("a-entity");
      this.el.appendChild(entity03);
      entity03.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: true,
        canBeClicked: true,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      entity03.object3D.position.set(0, 1.6, -5);
      entity03.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
      entity03.object3D.matrixNeedsUpdate = true;
    }
  });
}

if (TEST_WAYPOINTS_CLICKING) {
  AFRAME.registerSystem("test-waypoints-clicking", {
    init() {
      console.log("TESTING CLICKABLE WAYPOINTS");
      const v = new THREE.Vector3();

      const entity01 = document.createElement("a-entity");
      this.el.appendChild(entity01);
      entity01.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: false,
        canBeClicked: true,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      entity01.object3D.position.set(5, 2.6, 0);
      entity01.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
      entity01.object3D.matrixNeedsUpdate = true;

      const entity02 = document.createElement("a-entity");
      this.el.appendChild(entity02);
      entity02.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: false,
        canBeClicked: true,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      entity02.object3D.position.set(0, 2.6, 5);
      entity02.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
      entity02.object3D.matrixNeedsUpdate = true;

      const entity04 = document.createElement("a-entity");
      this.el.appendChild(entity04);
      entity04.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: false,
        canBeClicked: true,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      entity04.object3D.position.set(-5, 2.6, 0);
      entity04.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), -Math.PI / 2);
      entity04.object3D.matrixNeedsUpdate = true;

      const entity03 = document.createElement("a-entity");
      this.el.appendChild(entity03);
      entity03.setAttribute("waypoint", {
        canBeSpawnPoint: false,
        canBeOccupied: false,
        canBeClicked: true,
        willDisableMotion: false,
        willMaintainWorldUp: true
      });
      entity03.object3D.position.set(0, 2.6, -5);
      entity03.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
      entity03.object3D.matrixNeedsUpdate = true;
    }
  });
}
