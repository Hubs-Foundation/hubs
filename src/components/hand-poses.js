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

AFRAME.registerComponent("hand-pose", {
  multiple: true,
  schema: {
    pose: { default: 0 }
  },

  init() {
    this.animatePose = this.animatePose.bind(this);
    this.mixer = this.el.components["animation-mixer"];
    const object3DMap = this.mixer.el.object3DMap;
    const rootObj = object3DMap.mesh || object3DMap.scene;
    this.clipActionObject = rootObj.parent;
    const suffix = this.id == "left" ? "_L" : "_R";
    this.from = this.to = this.mixer.mixer.clipAction(POSES.open + suffix, this.clipActionObject);
    this.from.play();
  },

  update(oldData) {
    if (oldData.pose != this.data.pose) {
      this.animatePose(NETWORK_POSES[oldData.pose || 0], NETWORK_POSES[this.data.pose]);
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
    eventSrc: { type: "selector" }
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
    this.el.setAttribute(`hand-pose__${this.id}`, "pose", NETWORK_POSES.indexOf(POSES[evt.detail.current]));
  }
});
