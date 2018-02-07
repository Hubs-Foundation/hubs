AFRAME.registerComponent("cursor-hand", {
  dependencies: ['raycaster'],
  schema: {
    cursor: {type: "selector"}
  },

  init: function() {
    document.addEventListener("mousedown", (e) => {
      this.data.cursor.emit("action_grab");
    });

    document.addEventListener("mouseup", (e) => {
      this.data.cursor.emit("action_release");
    });
  },
  tick:  function() {
    const intersections = this.el.components.raycaster.intersections;
      if(intersections.length > 0) {
        const point = intersections[0].point;
        this.data.cursor.setAttribute('position', point);
      }
  //   let distance = this.data.maxDistance;
  //   const intersection = this.data.raycaster.components.raycaster;
  //   // console.log(intersection)
  //   // if (intersection && intersection.distance < this.data.maxDistance) {
  //   //   distance = intersection.distance;
  //   // }

  //   const head = this.data.raycaster.object3D;
  //   const origin = head.getWorldPosition();
  //   let direction = head.getWorldDirection();
  //   direction.multiplyScalar(-distance);
  //   let point = new THREE.Vector3();
  //   point.addVectors(origin, direction);
  //   this.el.setAttribute("position", {x: point.x, y: point.y, z: point.z});   
  }
});
