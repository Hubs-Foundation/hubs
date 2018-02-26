const GESTURES = {
  open: "open",
  // point: grip active, trackpad surface active, trigger inactive.
  point: "point",
  // pointThumb: grip active, trigger inactive, trackpad surface inactive.
  pointThumb: "pointThumb",
  // fist: grip active, trigger active, trackpad surface active.
  fist: "fist",
  // hold: trigger active, grip inactive.
  hold: "hold",
  // thumbUp: grip active, trigger active, trackpad surface inactive.
  thumbUp: "thumbUp"
};

const CONTROLLER_OFFSETS = {
  default: new THREE.Matrix4(),
  "oculus-touch-controls": new THREE.Matrix4().makeTranslation(0, -0.015, 0.04),
  "vive-controls": new THREE.Matrix4().compose(
    new THREE.Vector3(0, -0.017, 0.13),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-40 * THREE.Math.DEG2RAD, 0, 0)),
    new THREE.Vector3(1, 1, 1)
  ),
  "daydream-controls": new THREE.Matrix4().makeTranslation(0, 0, -0.04)
};

AFRAME.registerComponent("hand-controls2", {
  schema: { default: "left" },

  init() {
    const el = this.el;

    this.gesture = GESTURES.open;

    this.fingersDown = {
      thumb: false,
      index: false,
      middle: false,
      ring: false,
      pinky: false
    };

    this.onMiddleRingPinkyDown = this.updateGesture.bind(this, {
      middle: true,
      ring: true,
      pinky: true
    });

    this.onMiddleRingPinkyUp = this.updateGesture.bind(this, {
      middle: false,
      ring: false,
      pinky: false
    });

    this.onIndexDown = this.updateGesture.bind(this, {
      index: true
    });

    this.onIndexUp = this.updateGesture.bind(this, {
      index: false
    });

    this.onThumbDown = this.updateGesture.bind(this, {
      thumb: true
    });

    this.onThumbUp = this.updateGesture.bind(this, {
      thumb: false
    });

    this.onControllerConnected = this.onControllerConnected.bind(this);
    this.onControllerDisconnected = this.onControllerDisconnected.bind(this);

    this.connectedController = null;

    el.addEventListener("controllerconnected", this.onControllerConnected);
    el.addEventListener("controllerdisconnected", this.onControllerDisconnected);

    el.setAttribute("visible", false);
  },

  play() {
    const el = this.el;
    el.addEventListener("middle_ring_pinky_down", this.onMiddleRingPinkyDown);
    el.addEventListener("middle_ring_pinky_up", this.onMiddleRingPinkyUp);
    el.addEventListener("thumb_down", this.onThumbDown);
    el.addEventListener("thumb_up", this.onThumbUp);
    el.addEventListener("index_down", this.onIndexDown);
    el.addEventListener("index_up", this.onIndexUp);
  },

  pause() {
    const el = this.el;
    el.removeEventListener("middle_ring_pinky_down", this.onMiddleRingPinkyDown);
    el.removeEventListener("middle_ring_pinky_up", this.onMiddleRingPinkyUp);
    el.removeEventListener("thumb_down", this.onThumbDown);
    el.removeEventListener("thumb_up", this.onThumbUp);
    el.removeEventListener("index_down", this.onIndexDown);
    el.removeEventListener("index_up", this.onIndexUp);
  },

  // Attach the platform specific tracked controllers.
  update(prevData) {
    const el = this.el;
    const hand = this.data;

    const controlConfiguration = {
      hand: hand,
      model: false,
      rotationOffset: 0
    };

    if (hand !== prevData) {
      el.setAttribute("vive-controls", controlConfiguration);
      el.setAttribute("oculus-touch-controls", controlConfiguration);
      el.setAttribute("windows-motion-controls", controlConfiguration);
      el.setAttribute("daydream-controls", controlConfiguration);
    }
  },

  remove() {
    const el = this.el;
    el.removeEventListener("controllerconnected", this.onControllerConnected);
    el.removeEventListener("controllerdisconnected", this.onControllerDisconnected);
  },

  updateGesture(nextFingersDown) {
    Object.assign(this.fingersDown, nextFingersDown);
    const gesture = this.determineGesture();

    if (gesture !== this.gesture) {
      this.gesture = gesture;
      this.el.emit(this.last + "end");
      this.el.emit(this.gesture + "start");
    }
  },

  determineGesture() {
    const { thumb, index, middle, ring, pinky } = this.fingersDown;

    if (!thumb && !index && !middle && !ring && !pinky) {
      return GESTURES.open;
    } else if (thumb && index && middle && ring && pinky) {
      return GESTURES.fist;
    } else if (!thumb && index && middle && ring && pinky) {
      return GESTURES.thumbUp;
    } else if (!thumb && !index && middle && ring && pinky) {
      return GESTURES.pointThumb;
    } else if (!thumb && index && !middle && !ring && !pinky) {
      return GESTURES.hold;
    } else if (thumb && !index && !middle && !ring && !pinky) {
      return GESTURES.hold;
    } else if (thumb && index && !middle && !ring && !pinky) {
      return GESTURES.hold;
    } else if (thumb && !index && middle && ring && pinky) {
      return GESTURES.point;
    }

    console.warn("Did not find matching gesture for ", this.fingersDown);

    return GESTURES.open;
  },

  // Show controller when connected
  onControllerConnected(e) {
    this.connectedController = e.detail.name;
    this.el.setAttribute("visible", true);
  },

  // Hide controller on disconnect
  onControllerDisconnected() {
    this.connectedController = null;
    this.el.setAttribute("visible", false);
  },

  getControllerOffset() {
    if (CONTROLLER_OFFSETS[this.connectedController] === undefined) {
      return CONTROLLER_OFFSETS.default;
    }

    return CONTROLLER_OFFSETS[this.connectedController];
  }
});
