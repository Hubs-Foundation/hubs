const POSES = {
  open: "open",
  point: "point",
  fist: "fist",
  hold: "hold",
  thumbUp: "thumbUp",
  thumbDown: "thumbDown",
  indexDown: "indexDown",
  pinch: "pinch",
  mrpDown: "mrpDown"
};

export const CONTROLLER_OFFSETS = {
  default: new THREE.Matrix4(),
  "oculus-touch-controls": new THREE.Matrix4().makeTranslation(0, -0.015, 0.04),
  "oculus-go-controls": new THREE.Matrix4(),
  "vive-controls": new THREE.Matrix4().compose(
    new THREE.Vector3(0, -0.017, 0.13),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-40 * THREE.Math.DEG2RAD, 0, 0)),
    new THREE.Vector3(1, 1, 1)
  ),
  "windows-motion-controls": new THREE.Matrix4().compose(
    new THREE.Vector3(0, -0.017, 0.13),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-40 * THREE.Math.DEG2RAD, 0, 0)),
    new THREE.Vector3(1, 1, 1)
  ),
  "daydream-controls": new THREE.Matrix4().makeTranslation(0, 0, -0.04),
  "gearvr-controls": new THREE.Matrix4()
};

AFRAME.registerComponent("hand-controls2", {
  schema: { default: "left" },

  init() {
    const el = this.el;

    this.pose = POSES.open;

    this.fingersDown = {
      thumb: false,
      index: false,
      middle: false,
      ring: false,
      pinky: false
    };

    this.onMiddleRingPinkyDown = this.updatePose.bind(this, {
      middle: true,
      ring: true,
      pinky: true
    });

    this.onMiddleRingPinkyUp = this.updatePose.bind(this, {
      middle: false,
      ring: false,
      pinky: false
    });

    this.onIndexDown = this.updatePose.bind(this, {
      index: true
    });

    this.onIndexUp = this.updatePose.bind(this, {
      index: false
    });

    this.onThumbDown = this.updatePose.bind(this, {
      thumb: true
    });

    this.onThumbUp = this.updatePose.bind(this, {
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
      model: false
    };

    if (hand !== prevData) {
      el.setAttribute("vive-controls", controlConfiguration);
      el.setAttribute("oculus-touch-controls", controlConfiguration);
      el.setAttribute("oculus-go-controls", controlConfiguration);
      el.setAttribute("windows-motion-controls", controlConfiguration);
      el.setAttribute("daydream-controls", controlConfiguration);
      el.setAttribute("gearvr-controls", controlConfiguration);
    }
  },

  remove() {
    const el = this.el;
    el.removeEventListener("controllerconnected", this.onControllerConnected);
    el.removeEventListener("controllerdisconnected", this.onControllerDisconnected);
  },

  updatePose(nextFingersDown) {
    Object.assign(this.fingersDown, nextFingersDown);
    const pose = this.determinePose();

    if (pose !== this.pose) {
      const previous = this.pose;
      this.pose = pose;
      this.el.emit("hand-pose", { previous: previous, current: this.pose });
    }
  },

  determinePose() {
    const { thumb, index, middle, ring, pinky } = this.fingersDown;

    if (!thumb && !index && !middle && !ring && !pinky) {
      return POSES.open;
    } else if (thumb && index && middle && ring && pinky) {
      return POSES.fist;
    } else if (!thumb && index && middle && ring && pinky) {
      return POSES.thumbUp;
    } else if (!thumb && !index && middle && ring && pinky) {
      return POSES.mrpDown;
    } else if (!thumb && index && !middle && !ring && !pinky) {
      return POSES.indexDown;
    } else if (thumb && !index && !middle && !ring && !pinky) {
      return POSES.thumbDown;
    } else if (thumb && index && !middle && !ring && !pinky) {
      return POSES.pinch;
    } else if (thumb && !index && middle && ring && pinky) {
      return POSES.point;
    }

    console.warn("Did not find matching pose for ", this.fingersDown);

    return POSES.open;
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
