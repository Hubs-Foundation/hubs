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

AFRAME.registerComponent("hand-poses", {
  schema: {
    leftPose: { type: "string", default: "allOpen" },
    rightPose: { type: "string", default: "allOpen" },
    gltfEntity: { type: "string", default: "a-gltf-entity" }
  },

  init() {
    this.animatePose = this.animatePose.bind(this);
    this.animatePoses = this.animatePoses.bind(this);
    this.firstUpdate = this.firstUpdate.bind(this);
    this.mixer = this.el.components["animation-mixer"];
    this.leftClipFrom = this.leftClipTo = this.mixer.mixer.clipAction(POSES.open + "_L", this.clipActionObject);
    this.rightClipFrom = this.rightClipTo = this.mixer.mixer.clipAction(POSES.open + "_R", this.clipActionObject);
    this.leftClipTo.play();
    this.rightClipTo.play();
  },

  update(oldData) {
    if (!this.mixer) return;
    if (!this.clipActionObject) {
      const object3DMap = this.mixer.el.object3DMap;
      const rootObj = object3DMap.mesh || object3DMap.scene;
      this.clipActionObject = rootObj.parent;
      this.firstUpdate();
    } else {
      this.animatePoses(oldData);
    }
  },

  animatePose(hand, prev, curr) {
    this[`${hand}ClipFrom`].stop();
    this[`${hand}ClipTo`].stop();

    const duration = 0.065;
    const suffix = hand == "left" ? "_L" : "_R";
    const from = (this[`${hand}ClipFrom`] = this.mixer.mixer.clipAction(prev + suffix, this.clipActionObject));
    const to = (this[`${hand}ClipTo`] = this.mixer.mixer.clipAction(curr + suffix, this.clipActionObject));

    from.fadeOut(duration);
    to.fadeIn(duration);
    to.play();
    from.play();

    this.mixer.mixer.update(0.001);
  },

  animatePoses(oldData) {
    if (oldData.leftPose != this.data.leftPose) {
      this.animatePose("left", oldData.leftPose, this.data.leftPose);
    }
    if (oldData.rightPose != this.data.rightPose) {
      this.animatePose("right", oldData.rightPose, this.data.rightPose);
    }
  }
});

AFRAME.registerComponent("hand-poses-controller", {
  schema: {
    left: { type: "selector", default: "#player-left-controller" },
    right: { type: "selector", default: "#player-right-controller" }
  },

  init: function() {
    this.setHandPose = this.setHandPose.bind(this);

    this.el.setAttribute("hand-poses", {
      leftPose: POSES.open,
      rightPose: POSES.open
    });
  },

  play: function() {
    this.data.left.addEventListener("hand-pose", this.setHandPose);
    this.data.right.addEventListener("hand-pose", this.setHandPose);
  },

  pause: function() {
    this.data.left.removeEventListener("hand-pose", this.setHandPose);
    this.data.right.removeEventListener("hand-pose", this.setHandPose);
  },

  setHandPose: function(evt) {
    const { current, previous } = evt.detail;
    const isLeft = evt.target === this.data.left;
    const pose = POSES[current];
    this.el.setAttribute("hand-poses", `${isLeft ? "left" : "right"}Pose`, pose);
  }
});
