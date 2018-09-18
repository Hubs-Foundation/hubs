/* global CANNON */
AFRAME.registerComponent("heightfield", {
  init() {
    this.el.addEventListener("componentinitialized", e => {
      if (e.detail.name === "static-body") {
        this.generateAndAddHeightfield(this.el.components["static-body"]);
      }
    });
    this.el.setAttribute("static-body", { shape: "none", mass: 0 });
  },
  generateAndAddHeightfield(body) {
    const mesh = this.el.object3D.getObjectByProperty("type", "Mesh");
    mesh.geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    mesh.geometry.boundingBox.getSize(size);

    const minDistance = 0.25;
    const resolution = (size.x + size.z) / 2 / minDistance;
    const distance = Math.max(minDistance, (size.x + size.z) / 2 / resolution);

    const data = [];
    const down = new THREE.Vector3(0, -1, 0);
    const position = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const intersections = [];
    const meshPos = new THREE.Vector3();
    mesh.getWorldPosition(meshPos);
    const offsetX = -size.x / 2 + meshPos.x;
    const offsetZ = -size.z / 2 + meshPos.z;
    let min = Infinity;
    for (let z = 0; z < resolution; z++) {
      data[z] = [];
      for (let x = 0; x < resolution; x++) {
        position.set(offsetX + x * distance, size.y / 2, offsetZ + z * distance);
        raycaster.set(position, down);
        intersections.length = 0;
        raycaster.intersectObject(mesh, false, intersections);
        let val;
        if (intersections.length) {
          val = -intersections[0].distance + size.y / 2;
        } else {
          val = -size.y / 2;
        }
        data[z][x] = val;
        if (val < min) {
          min = data[z][x];
        }
      }
    }
    // Cannon doesn't like heightfields with negative heights.
    for (let z = 0; z < resolution; z++) {
      for (let x = 0; x < resolution; x++) {
        data[z][x] -= min;
      }
    }

    const orientation = new CANNON.Quaternion();
    orientation.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    const rotation = new CANNON.Quaternion();
    rotation.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    rotation.mult(orientation, orientation);
    const offset = new CANNON.Vec3(-size.x / 2, min, -size.z / 2);

    const shape = new CANNON.Heightfield(data, { elementSize: distance });
    body.addShape(shape, offset, orientation);
  }
});
