AFRAME.registerComponent("cursor-hand", {
  dependencies: ['raycaster'],
  schema: {
    cursor: {type: "selector"},
    maxDistance: {type: "number", default: 3}
  },

  init: function() {
    this.isGrabbing = false;
    this.currentDistance = this.data.maxDistance;

    document.addEventListener("mousedown", (e) => {
      this.data.cursor.emit("action_grab");
    });

    document.addEventListener("mouseup", (e) => {
      this.data.cursor.emit("action_release");
    });
  },
  tick: function() {
    const isGrabbing = this.data.cursor.components["super-hands"].state.has("grab-start");
    let isIntersecting = false;

    if (!isGrabbing) {
      const intersections = this.el.components.raycaster.intersections;
      if(intersections.length > 0) {
        isIntersecting = true;
        const point = intersections[0].point;
        this.data.cursor.setAttribute('position', point);
        this.currentDistance = Math.min(intersections[0].distance, this.data.maxDistance);
      } else {
        this.currentDistance = this.data.maxDistance;
      }
    }

    if (isGrabbing || !isIntersecting) {
      const head = this.el.object3D;
      const origin = head.getWorldPosition();
      let direction = head.getWorldDirection();
      direction.multiplyScalar(-this.currentDistance);
      let point = new THREE.Vector3();
      point.addVectors(origin, direction);
      this.data.cursor.setAttribute("position", {x: point.x, y: point.y, z: point.z});
    }
  }
});
