AFRAME.registerComponent("super-cursor", {
  dependencies: ["raycaster"],
  schema: {
    cursor: { type: "selector" },
    maxDistance: { type: "number", default: 3 },
    minDistance: { type: "number", default: 0.5 }
  },

  init: function() {
    this.isGrabbing = false;
    this.wasIntersecting = false;
    this.currentDistance = this.data.maxDistance;
    this.currentDistanceMod = 0;
    this.enabled = true;
    this.isGrabbing = false;
    this.origin = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.point = new THREE.Vector3();
  },

  play: function() {
    this.mouseDownListener = this._handleMouseDown.bind(this);
    this.mouseUpListener = this._handleMouseUp.bind(this);
    this.wheelListener = this._handleWheel.bind(this);
    this.enterVRListener = this._handleEnterVR.bind(this);
    this.exitVRListener = this._handleExitVR.bind(this);   

    document.addEventListener("mousedown", this.mouseDownListener);
    document.addEventListener("mouseup", this.mouseUpListener);
    document.addEventListener("wheel", this.wheelListener);
    window.addEventListener("enter-vr", this.enterVRListener);
    window.addEventListener("exit-vr", this.exitVRListener);
  },

  pause: function() {
    document.removeEventListener("mousedown", this.mouseDownListener);
    document.removeEventListener("mouseup", this.mouseUpListener);
    document.removeEventListener("wheel", this.wheelListener);
    window.removeEventListener("enter-vr", this.enterVRListener);
    window.removeEventListener("exit-vr", this.exitVRListener);
  },

  tick: function() {
    if (!this.enabled) {
      return;
    }

    this.isGrabbing = this.data.cursor.components["super-hands"].state.has("grab-start");
    let isIntersecting = false;

    if (!this.isGrabbing) {
      const intersections = this.el.components.raycaster.intersections;
      if (intersections.length > 0 && intersections[0].distance <= this.data.maxDistance) {
        isIntersecting = true;
        this.point = intersections[0].point;
        this.data.cursor.object3D.position.copy(this.point);
        this.currentDistance = intersections[0].distance;
        this.currentDistanceMod = 0;
      } else {
        this.currentDistance = this.data.maxDistance;
      }
    }

    if (this.isGrabbing || !isIntersecting) {
      const head = this.el.object3D;
      head.getWorldPosition(this.origin);
      head.getWorldDirection(this.direction);
      const distance = Math.min(
        Math.max(this.data.minDistance, this.currentDistance - this.currentDistanceMod),
        this.data.maxDistance
      );
      this.currentDistanceMod = this.currentDistance - distance;
      this.direction.multiplyScalar(-distance);
      this.point.addVectors(this.origin, this.direction);
      this.data.cursor.object3D.position.copy(this.point);
    }

    if ((this.isGrabbing || isIntersecting) && !this.wasIntersecting) {
      this.wasIntersecting = true;
      this.data.cursor.setAttribute("material", {color: "#00FF00"});
    } else if (!this.isGrabbing && !isIntersecting && this.wasIntersecting) {
      this.wasIntersecting = false;
      this.data.cursor.setAttribute("material", {color: "#00EFFF"});
    }
  },

  _handleMouseDown: function(e) {
    this.data.cursor.emit("action_grab", {});
  },

  _handleMouseUp: function(e) {
    this.data.cursor.emit("action_release", {});
  },

  _handleWheel: function(e) {
    if (this.isGrabbing) this.currentDistanceMod += e.deltaY / 10;
  }, 

  _handleEnterVR: function(e) {
    if (AFRAME.utils.device.checkHeadsetConnected() || AFRAME.utils.device.isMobile()) {
      this.enabled = false;
      this.data.cursor.setAttribute("visible", false);
    }
  },

  _handleExitVR: function(e) {
    this.enabled = true;
    this.data.cursor.setAttribute("visible", true);
  },
});
