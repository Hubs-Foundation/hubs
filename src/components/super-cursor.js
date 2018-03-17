AFRAME.registerComponent("super-cursor", {
  dependencies: ["raycaster"],
  schema: {
    cursor: { type: "selector" },
    camera: { type: "selector" },
    maxDistance: { default: 3 },
    minDistance: { default: 0.5 },
    cursorColorHovered: { default: "#FF0000" },
    cursorColorUnhovered: { efault: "#FFFFFF" }
  },

  init: function() {
    this.isGrabbing = false;
    this.isInteractable = false;
    this.wasIntersecting = false;
    this.currentDistance = this.data.maxDistance;
    this.currentDistanceMod = 0;
    this.enabled = true;
    this.origin = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.point = new THREE.Vector3();
    this.mousePos = new THREE.Vector2();
    this.mouseDown = false;

    this.data.cursor.setAttribute("material", { color: this.data.cursorColorUnhovered });

    this.mouseDownListener = this._handleMouseDown.bind(this);
    this.mouseMoveListener = this._handleMouseMove.bind(this);
    this.mouseUpListener = this._handleMouseUp.bind(this);
    this.wheelListener = this._handleWheel.bind(this);
    this.enterVRListener = this._handleEnterVR.bind(this);
    this.exitVRListener = this._handleExitVR.bind(this);
  },

  play: function() {
    document.addEventListener("mousedown", this.mouseDownListener);
    document.addEventListener("mousemove", this.mouseMoveListener);
    document.addEventListener("mouseup", this.mouseUpListener);
    document.addEventListener("wheel", this.wheelListener);
    window.addEventListener("enter-vr", this.enterVRListener);
    window.addEventListener("exit-vr", this.exitVRListener);

    this._enable();
  },

  pause: function() {
    document.removeEventListener("mousedown", this.mouseDownListener);
    document.removeEventListener("mousemove", this.mouseMoveListener);
    document.removeEventListener("mouseup", this.mouseUpListener);
    document.removeEventListener("wheel", this.wheelListener);
    window.removeEventListener("enter-vr", this.enterVRListener);
    window.removeEventListener("exit-vr", this.exitVRListener);

    this._disable();
  },

  tick: function() {
    if (!this.enabled) {
      return;
    }

    this.isGrabbing = this.data.cursor.components["super-hands"].state.has("grab-start");
    let isIntersecting = false;

    const camera = this.data.camera.components.camera.camera;
    const raycaster = this.el.components.raycaster.raycaster;
    raycaster.setFromCamera(this.mousePos, camera);
    this.origin = raycaster.ray.origin;
    this.direction = raycaster.ray.direction;
    this.el.setAttribute("raycaster", { origin: this.origin, direction: this.direction });

    let className = null;

    if (!this.isGrabbing) {
      const intersections = this.el.components.raycaster.intersections;
      if (intersections.length > 0 && intersections[0].distance <= this.data.maxDistance) {
        isIntersecting = true;
        className = intersections[0].object.el.className;
        this.point = intersections[0].point;
        this.data.cursor.object3D.position.copy(this.point);
        this.currentDistance = intersections[0].distance;
        this.currentDistanceMod = 0;
      } else {
        this.currentDistance = this.data.maxDistance;
      }
    }

    if (this.isGrabbing || !isIntersecting) {
      const distance = Math.min(
        Math.max(this.data.minDistance, this.currentDistance - this.currentDistanceMod),
        this.data.maxDistance
      );
      this.currentDistanceMod = this.currentDistance - distance;
      this.direction.multiplyScalar(distance);
      this.point.addVectors(this.origin, this.direction);
      this.data.cursor.object3D.position.copy(this.point);
    }

    this.isInteractable = isIntersecting && className === "interactable";

    if ((this.isGrabbing || this.isInteractable) && !this.wasIntersecting) {
      this.wasIntersecting = true;
      this.data.cursor.setAttribute("material", { color: this.data.cursorColorHovered });
    } else if (!this.isGrabbing && !this.isInteractable && this.wasIntersecting) {
      this.wasIntersecting = false;
      this.data.cursor.setAttribute("material", { color: this.data.cursorColorUnhovered });
    }
  },

  _handleMouseDown: function(e) {
    this.mouseDown = true;
    if (this.isInteractable) {
      const lookControls = this.data.camera.components["look-controls"];
      lookControls.pause();
    }
    this.data.cursor.emit("action_grab", {});
  },

  _handleMouseMove: function(e) {
    this.mousePos.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  },

  _handleMouseUp: function(e) {
    this.mouseDown = false;
    const lookControls = this.data.camera.components["look-controls"];
    lookControls.play();
    this.data.cursor.emit("action_release", {});
  },

  _handleWheel: function(e) {
    if (this.isGrabbing) this.currentDistanceMod += e.deltaY / 10;
  },

  _handleEnterVR: function(e) {
    if (AFRAME.utils.device.checkHeadsetConnected() || AFRAME.utils.device.isMobile()) {
      this._disable();
    }
  },

  _handleExitVR: function(e) {
    this._enable();
  },

  _enable: function() {
    this.enabled = true;
    this.data.cursor.setAttribute("visible", true);
    this.el.setAttribute("raycaster", { enabled: true });
  },

  _disable: function() {
    this.enabled = false;
    this.data.cursor.setAttribute("visible", false);
    this.el.setAttribute("raycaster", { enabled: false });
  }
});
