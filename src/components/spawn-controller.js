AFRAME.registerComponent("spawn-controller", {
  schema: {
    radius: { type: "number", default: 1 }
  },

  init() {
    const el = this.el;
    const center = el.getAttribute("position");

    const angleRad = Math.random() * 2 * Math.PI;
    const circlePoint = this.getPointOnCircle(this.data.radius, angleRad);
    const worldPoint = {
      x: circlePoint.x + center.x,
      y: center.y,
      z: circlePoint.z + center.z
    };
    el.setAttribute("position", worldPoint);

    const angleDeg = angleRad * THREE.Math.RAD2DEG;
    const angleToCenter = -1 * angleDeg + 90;
    el.setAttribute("rotation", { x: 0, y: angleToCenter, z: 0 });
  },

  getPointOnCircle(radius, angleRad) {
    const x = Math.cos(angleRad) * radius;
    const z = Math.sin(angleRad) * radius;
    return { x: x, z: z };
  }
});
