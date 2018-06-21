function almostEquals(u, v, eps) {
  return Math.abs(u.x - v.x) < eps && Math.abs(u.y - v.y) < eps && Math.abs(u.z - v.z) < eps;
}

function debounce(fn, delay) {
  let timer = null;
  return function() {
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

AFRAME.registerComponent("auto-scale-cannon-physics-body", {
  dependencies: ["body"],

  init: function() {
    this.body = this.el.components["body"];
    this.prevScale = this.el.object3D.scale.clone();
    this.updateCannonScale = debounce(this.updateCannonScale.bind(this), 200);
  },

  tick: function() {
    const scale = this.el.object3D.scale;
    if (!almostEquals(scale, this.prevScale, 0.001)) {
      this.updateCannonScale();
      this.prevScale.copy(scale);
    }
  },

  updateCannonScale: function() {
    this.body.updateCannonScale();
    console.log("updating?");
  }
});
