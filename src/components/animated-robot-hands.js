// Global THREE, AFRAME
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

// TODO: When we have analog values of index-finger triggers or middle-finger grips,
//       it would be nice to animate the hands proportionally to those analog values.
AFRAME.registerComponent("animated-robot-hands", {
  schema: {
    mixer: { type: "string" },
    leftHand: { type: "string", default: "#player-left-controller" },
    rightHand: { type: "string", default: "#player-right-controller" }
  },

  init: function() {
    this.playAnimation = this.playAnimation.bind(this);

    const mixerEl = this.el.querySelector(this.data.mixer);
    this.leftHand = this.el.querySelector(this.data.leftHand);
    this.rightHand = this.el.querySelector(this.data.rightHand);

    this.mixer = mixerEl.mixer;

    const object3DMap = mixerEl.object3DMap;
    const rootObj = object3DMap.mesh || object3DMap.scene;
    this.clipActionObject = rootObj.parent;

    // Set hands to open pose because the bind pose is funky dues
    // to the workaround for FBX2glTF animations.
    this.openL = this.mixer.clipAction(POSES.open + "_L", this.clipActionObject);
    this.openR = this.mixer.clipAction(POSES.open + "_R", this.clipActionObject);
    this.openL.play();
    this.openR.play();
  },

  play: function() {
    this.leftHand.addEventListener("hand-pose", this.playAnimation);
    this.rightHand.addEventListener("hand-pose", this.playAnimation);
  },

  pause: function() {
    this.leftHand.removeEventListener("hand-pose", this.playAnimation);
    this.rightHand.removeEventListener("hand-pose", this.playAnimation);
  },

  // Animate from pose to pose.
  // TODO: Transition from current pose (which may be BETWEEN two other poses)
  //       to the target pose, rather than stopping previous actions altogether.
  playAnimation: function(evt) {
    const isLeft = evt.target === this.leftHand;
    // Stop the initial animations we started when the model loaded.
    if (!this.openLStopped && isLeft) {
      this.openL.stop();
      this.openLStopped = true;
    } else if (!this.openRStopped && !isLeft) {
      this.openR.stop();
      this.openRStopped = true;
    }

    const { current, previous } = evt.detail;
    const mixer = this.mixer;
    const suffix = isLeft ? "_L" : "_R";
    const prevPose = POSES[previous] + suffix;
    const currPose = POSES[current] + suffix;

    // STOP previous actions playing for this hand.
    if (this["pose" + suffix + "_to"] !== undefined) {
      this["pose" + suffix + "_to"].stop();
    }
    if (this["pose" + suffix + "_from"] !== undefined) {
      this["pose" + suffix + "_from"].stop();
    }

    const duration = 0.065;
    //    console.log(
    //      `Animating ${isLeft ? "left" : "right"} hand from ${prevPose} to ${currPose} over ${duration} seconds.`
    //    );
    const from = mixer.clipAction(prevPose, this.clipActionObject);
    const to = mixer.clipAction(currPose, this.clipActionObject);
    from.fadeOut(duration);
    to.fadeIn(duration);
    to.play();
    from.play();
    // Update the mixer slightly to prevent one frame of the default pose
    // from appearing. TODO: Find out why that happens
    this.mixer.update(0.001);

    this["pose" + suffix + "_to"] = to;
    this["pose" + suffix + "_from"] = from;
  }
});
