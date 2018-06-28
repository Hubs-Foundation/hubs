function almostEquals(u, v, epsilon) {
  return Math.abs(u.x - v.x) < epsilon && Math.abs(u.y - v.y) < epsilon && Math.abs(u.z - v.z) < epsilon;
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

const autoScaleCannonPhysicsBody = {
  dependencies: ["body"],

  init() {
    this.body = this.el.components["body"];
    this.prevScale = this.el.object3D.scale.clone();
    this.updateCannonScale = debounce(this.updateCannonScale.bind(this), 100);
  },

  tick() {
    const scale = this.el.object3D.scale;
    // Note: This only checks if the LOCAL scale of the object3D changes.
    if (!almostEquals(scale, this.prevScale, 0.001)) {
      this.updateCannonScale();
      this.prevScale.copy(scale);
    }
  },

  updateCannonScale() {
    this.body.updateCannonScale();
  }
};

AFRAME.registerComponent("auto-scale-cannon-physics-body", autoScaleCannonPhysicsBody);
