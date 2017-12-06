AFRAME.registerComponent('spawn-controller', {
  schema: {
    radius: {type: 'number', default: 1},
  },

  init: function() {
    var el = this.el;
    var center = el.getAttribute('position');

    var angleRad = Math.random() * 2 * Math.PI;
    var circlePoint = this.getPointOnCircle(this.data.radius, angleRad);
    var worldPoint = {x: circlePoint.x + center.x, y: center.y, z: circlePoint.z + center.z};
    el.setAttribute('position', worldPoint);

    var angleDeg = angleRad * THREE.Math.RAD2DEG;
    var angleToCenter = -1 * angleDeg + 90;
    el.setAttribute('rotation', {x: 0, y: angleToCenter, z: 0});
  },

  getPointOnCircle: function (radius, angleRad) {
    var x = Math.cos(angleRad)*radius;
    var z = Math.sin(angleRad)*radius;
    return {x: x, z: z};
  }
});