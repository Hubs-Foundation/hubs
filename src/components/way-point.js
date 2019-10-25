AFRAME.registerComponent("visible-thing", {
  schema: {},
  init() {
    this.el.appendChild(document.importNode(document.getElementById("visible-thing-template").content, true));
  },
  remove() {
    this.el.querySelector(".way-point-icon").object3D.removeEventListener("interact", this.teleport);
  }
});
AFRAME.registerComponent("way-point", {
  schema: {},
  init() {
    this.el.appendChild(document.importNode(document.getElementById("way-point-template").content, true));
    this.teleport = this.teleport.bind(this);
    console.log(this);
    setTimeout(() => {
      if (!this.el.parentNode) return;
      this.el.querySelector(".way-point-icon").object3D.addEventListener("interact", this.teleport);
    }, 0);
  },
  teleport() {
    this.characterController =
      this.characterController || document.getElementById("avatar-rig").components["character-controller"];
    this.characterController.waypointTo(this.el.object3D.matrixWorld);
  },
  remove() {
    this.el.querySelector(".way-point-icon").object3D.removeEventListener("interact", this.teleport);
  }
});

AFRAME.registerSystem("make-some-waypoints-for-testing", {
  init() {
    const v = new THREE.Vector3();

    const el0 = document.createElement("a-entity");
    this.el.appendChild(el0);
    el0.setAttribute("way-point", "foo", "bar");
    el0.object3D.position.set(5, 1.6, 0);
    el0.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
    el0.object3D.matrixNeedsUpdate = true;

    const el6 = document.createElement("a-entity");
    this.el.appendChild(el6);
    el6.setAttribute("way-point", "foo", "bar");
    el6.object3D.position.set(5, 2.0, 0);
    el6.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
    el6.object3D.matrixNeedsUpdate = true;

    const el4 = document.createElement("a-entity");
    this.el.appendChild(el4);
    el4.setAttribute("way-point", "foo", "bar");
    el4.object3D.position.set(-5, 1.6, 0);
    el4.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), -Math.PI / 2);
    el4.object3D.matrixNeedsUpdate = true;

    const el2 = document.createElement("a-entity");
    this.el.appendChild(el2);
    el2.setAttribute("way-point", "foo", "bar");
    el2.object3D.position.set(0, 1.6, 5);
    el2.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
    el2.object3D.matrixNeedsUpdate = true;

    const el3 = document.createElement("a-entity");
    this.el.appendChild(el3);
    el3.setAttribute("way-point", "foo", "bar");
    el3.object3D.position.set(0, 1.6, -5);
    el3.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
    el3.object3D.matrixNeedsUpdate = true;

    const el5 = document.createElement("a-entity");
    this.el.appendChild(el5);
    el5.setAttribute("way-point", "foo", "bar");
    el5.object3D.position.set(5, 1.6, 5);
    el5.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 4);
    el5.object3D.matrixNeedsUpdate = true;

    const el7 = document.createElement("a-entity");
    this.el.appendChild(el7);
    el7.setAttribute("way-point", "foo", "bar");
    el7.object3D.position.set(1, 4, 0);
    el7.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), -Math.PI / 2);
    el7.object3D.matrixNeedsUpdate = true;
    const el8 = document.createElement("a-entity");
    this.el.appendChild(el8);
    el8.setAttribute("way-point", "foo", "bar");
    el8.object3D.position.set(-1, 4, 0);
    el8.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
    el8.object3D.matrixNeedsUpdate = true;
    const el9 = document.createElement("a-entity");
    this.el.appendChild(el9);
    el9.setAttribute("way-point", "foo", "bar");
    el9.object3D.position.set(0, 4, 1);
    el9.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
    el9.object3D.matrixNeedsUpdate = true;
    const el10 = document.createElement("a-entity");
    this.el.appendChild(el10);
    el10.setAttribute("way-point", "foo", "bar");
    el10.object3D.position.set(0, 4, -1);
    el10.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
    el10.object3D.matrixNeedsUpdate = true;

    const el11 = document.createElement("a-entity");
    this.el.appendChild(el11);
    el11.setAttribute("way-point", "foo", "bar");
    el11.object3D.position.set(0, 10, 0);
    el11.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
    el11.object3D.scale.set(3, 3, 3);
    el11.object3D.matrixNeedsUpdate = true;

    const el12 = document.createElement("a-entity");
    this.el.appendChild(el12);
    el12.setAttribute("way-point", "foo", "bar");
    el12.object3D.position.set(0, 12, 0);
    el12.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
    el12.object3D.scale.set(1, 3, 1);
    el12.object3D.matrixNeedsUpdate = true;

    //const el8 = document.createElement("a-entity");
    //this.el.appendChild(el8);
    //el8.setAttribute("visible-thing", "foo", "bar");
    //el8.object3D.position.set(-5, 4, 0);
    //el8.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 1).normalize(), -Math.PI / 2);
    //el8.object3D.matrixNeedsUpdate = true;
    //window.visibleThing = el8;
  }
});
