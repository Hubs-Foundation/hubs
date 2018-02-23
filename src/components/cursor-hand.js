AFRAME.registerComponent("cursor-hand", {
  dependencies: ['raycaster'],
  schema: {
    cursor: {type: "selector"},
    maxDistance: {type: "number", default: 3},
    minDistance: {type: "number", default: 0.5}
  },

  init: function() {
    this.isGrabbing = false;
    this.wasIntersecting = false;
    this.currentDistance = this.data.maxDistance;
    this.currentDistanceMod = 0;
    this.enabled = true;
    this.isGrabbing = false;

    document.addEventListener("mousedown", (e) => {
      this.data.cursor.emit("action_grab", {});
    });

    document.addEventListener("mouseup", (e) => {
      this.data.cursor.emit("action_release", {});
    });

    document.addEventListener("wheel", (e) => {
      if (this.isGrabbing)
        this.currentDistanceMod += e.deltaY/10;
    });

    window.addEventListener('enter-vr', e => {
      if (AFRAME.utils.device.checkHeadsetConnected() || AFRAME.utils.device.isMobile()) {
        this.enabled = false;
        this.data.cursor.setAttribute("visible", false);
      }
    });

    window.addEventListener('exit-vr', e => {
      this.enabled = true;
      this.data.cursor.setAttribute("visible", true);
    });
  },
  tick: function() {
    if (!this.enabled) {
      return;
    }

    this.isGrabbing = this.data.cursor.components["super-hands"].state.has("grab-start");
    let isIntersecting = false;

    if (!this.isGrabbing) {
      const intersections = this.el.components.raycaster.intersections;
      if(intersections.length > 0 && intersections[0].distance <= this.data.maxDistance) {
        isIntersecting = true;
        const point = intersections[0].point;
        this.data.cursor.setAttribute('position', point);
        this.currentDistance = intersections[0].distance;
        this.currentDistanceMod = 0;
      } else {
        this.currentDistance = this.data.maxDistance;
      }
    }

    if (this.isGrabbing || !isIntersecting) {
      const head = this.el.object3D;
      const origin = head.getWorldPosition();
      let direction = head.getWorldDirection();
      const distance = Math.min(Math.max(this.data.minDistance, this.currentDistance - this.currentDistanceMod), this.data.maxDistance);
      this.currentDistanceMod = this.currentDistance - distance;
      direction.multiplyScalar(-distance);
      let point = new THREE.Vector3();
      point.addVectors(origin, direction);
      this.data.cursor.setAttribute("position", {x: point.x, y: point.y, z: point.z});
    }

    if ((this.isGrabbing || isIntersecting) && !this.wasIntersecting) {
      this.wasIntersecting = true;
      this.data.cursor.setAttribute("material", "color: #00FF00");
    } else if ((!this.isGrabbing && !isIntersecting) && this.wasIntersecting) {
      this.wasIntersecting = false;
      this.data.cursor.setAttribute("material", "color: #00EFFF");
    }
  }
});
