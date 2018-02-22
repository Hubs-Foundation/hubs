AFRAME.registerComponent("cursor-hand", {
  dependencies: ['raycaster'],
  schema: {
    cursor: {type: "selector"},
    maxDistance: {type: "number", default: 3},
    minDistance: {type: "number", default: 1}
  },

  init: function() {
    this.isGrabbing = false;
    this.wasIntersecting = false;
    this.currentDistance = this.data.maxDistance;
    this.currentDistanceMod = 0;
    this.enabled = true;

    document.addEventListener("mousedown", (e) => {
      this.data.cursor.emit("action_grab", {});
    });

    document.addEventListener("mouseup", (e) => {
      this.data.cursor.emit("action_release", {});
    });

    document.addEventListener("wheel", (e) => {
      const updated = this.currentDistanceMod + e.deltaY/10;
      this.currentDistanceMod = Math.min(Math.max(0, updated), this.data.maxDistance - this.data.minDistance);
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

    const isGrabbing = this.data.cursor.components["super-hands"].state.has("grab-start");
    let isIntersecting = false;

    if (!isGrabbing) {
      const intersections = this.el.components.raycaster.intersections;
      if(intersections.length > 0 && intersections[0].distance <= this.data.maxDistance) {
        isIntersecting = true;
        const point = intersections[0].point;
        this.data.cursor.setAttribute('position', point);
        this.currentDistance = intersections[0].distance;
      } else {
        this.currentDistance = this.data.maxDistance;
      }
    }

    if (isGrabbing || !isIntersecting) {
      const head = this.el.object3D;
      const origin = head.getWorldPosition();
      let direction = head.getWorldDirection();
      direction.multiplyScalar(-(this.currentDistance - this.currentDistanceMod));
      let point = new THREE.Vector3();
      point.addVectors(origin, direction);
      this.data.cursor.setAttribute("position", {x: point.x, y: point.y, z: point.z});
    }

    if ((isGrabbing || isIntersecting) && !this.wasIntersecting) {
      this.wasIntersecting = true;
      this.data.cursor.setAttribute("material", "color: #00FF00");
    } else if ((!isGrabbing && !isIntersecting) && this.wasIntersecting) {
      this.wasIntersecting = false;
      this.data.cursor.setAttribute("material", "color: #00EFFF");
    }
  }
});
