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
    mixer: { type: "string" },
    gltfEntity: { type: "string", default: "a-gltf-entity" }
  },

  init() {
    this.animatePose = this.animatePose.bind(this);
    this.animatePoses = this.animatePoses.bind(this);
    this.firstUpdate = this.firstUpdate.bind(this);
    const mixerEl = this.el.querySelector(this.data.mixer);
    if (mixerEl) {
      this.mixer = mixerEl.components["animation-mixer"];
    }

    const onLoad = () => {
      const mixerEl = this.el.querySelector(this.data.mixer);
      if (mixerEl) {
        this.mixer = mixerEl.components["animation-mixer"];
      }
      if (!this.mixer) {
        // Can't find the mixer until spawned into the scene.
        // TODO: Figure out the right event to listen to to get this done.
        window.setTimeout(onLoad, 100);
        return;
      }
      this.el.querySelector(this.data.gltfEntity).removeEventListener("loaded", onLoad);
    };
    this.el.querySelector(this.data.gltfEntity).addEventListener("loaded", onLoad);

    //TODO: the loaded event isn't being caught, so we do it in a timeout
    window.setTimeout(onLoad, 10);
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

  firstUpdate() {
    this.leftClipFrom = this.leftClipTo = this.mixer.mixer.clipAction(POSES.open + "_L", this.clipActionObject);
    this.rightClipFrom = this.rightClipTo = this.mixer.mixer.clipAction(POSES.open + "_R", this.clipActionObject);
    this.leftClipTo.play();
    this.rightClipTo.play();
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

    this.mixer.update(0.001);
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
