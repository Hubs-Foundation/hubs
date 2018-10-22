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
    const { offset, distance, data } = this.data;

    const orientation = new CANNON.Quaternion();
    orientation.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);

    const rotation = new CANNON.Quaternion();
    rotation.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    rotation.mult(orientation, orientation);

    const cannonOffset = new CANNON.Vec3(offset.x, offset.y, offset.z);

    const shape = new CANNON.Heightfield(data, { elementSize: distance });

    body.addShape(shape, cannonOffset, orientation);
  }
});
