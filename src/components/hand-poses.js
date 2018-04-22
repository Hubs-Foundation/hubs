const POSES = {
  open: "allOpen",
  thumbDown: "thumbDown",
  indexDown: "indexDown",
  mrpDown: "mrpDown",
  thumbUp: "thumbsUp",
  point: "point",
  fist: "allGrip",
  pinch: "pinch"
};

const NETWORK_POSES = ["allOpen", "thumbDown", "indexDown", "mrpDown", "thumbsUp", "point", "allGrip", "pinch"];

AFRAME.registerComponent("hand-pose-state", {
  multiple: true,
  schema: {
    pose: { default: 0 }
  },
  init() {
    this.setSelfAsStore = this.setSelfAsStore.bind(this);
    this.setSelfAsStore();
  },
  setSelfAsStore() {
    let poseEl = this.el.querySelector(`[hand-pose__${this.id}]`);
    if (!poseEl) {
      window.setTimeout(() => {
        this.setSelfAsStore();
      }, 3000);
      return;
    }
    poseEl.components[`hand-pose__${this.id}`].store = this;
  }
});

AFRAME.registerComponent("hand-pose", {
  multiple: true,

  init() {
    this.pose = 0;
    this.animatePose = this.animatePose.bind(this);
    this.mixer = this.el.components["animation-mixer"];
    const object3DMap = this.mixer.el.object3DMap;
    const rootObj = object3DMap.mesh || object3DMap.scene;
    this.clipActionObject = rootObj.parent;
    const suffix = this.id == "left" ? "_L" : "_R";
    this.from = this.to = this.mixer.mixer.clipAction(POSES.open + suffix, this.clipActionObject);
    this.from.play();
  },

  tick() {
    if (!this.store) return;
    if (this.store.data.pose != this.pose) {
      this.animatePose(NETWORK_POSES[this.pose], NETWORK_POSES[this.store.data.pose]);
      this.pose = this.store.data.pose;
    }
  },

  animatePose(prev, curr) {
    this.from.stop();
    this.to.stop();

    const duration = 0.065;
    const suffix = this.id == "left" ? "_L" : "_R";
    this.from = this.mixer.mixer.clipAction(prev + suffix, this.clipActionObject);
    this.to = this.mixer.mixer.clipAction(curr + suffix, this.clipActionObject);

    this.from.fadeOut(duration);
    this.to.fadeIn(duration);
    this.to.play();
    this.from.play();

    this.mixer.mixer.update(0.001);
  }
});

AFRAME.registerComponent("hand-pose-controller", {
  multiple: true,
  schema: {
    eventSrc: { type: "selector" },
    store: { type: "selector" }
  },
  init: function() {
    this.setHandPose = this.setHandPose.bind(this);
  },

  play: function() {
    this.data.eventSrc.addEventListener("hand-pose", this.setHandPose);
  },

  pause: function() {
    this.data.eventSrc.removeEventListener("hand-pose", this.setHandPose);
  },

  setHandPose: function(evt) {
    this.data.store.setAttribute(
      `hand-pose-state__${this.id}`,
      "pose",
      NETWORK_POSES.indexOf(POSES[evt.detail.current])
    );
  }
});
