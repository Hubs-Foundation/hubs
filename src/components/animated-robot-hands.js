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
    leftHand: { type: "selector", default: "#player-left-controller" },
    rightHand: { type: "selector", default: "#player-right-controller" }
  },

  init: function() {
    window.hands = this;
    this.playAnimation = this.playAnimation.bind(this);

    // Get the three.js object in the scene graph that has the animation data
    const root = this.el.querySelector("a-gltf-entity .RootScene").object3D.children[0];
    this.mixer = new THREE.AnimationMixer(root);

    // Set hands to open pose because the bind pose is funky due
    // to the workaround for FBX2glTF animations.

    this.openL = this.mixer.clipAction(POSES.open + "_L");
    this.openR = this.mixer.clipAction(POSES.open + "_R");
    this.openL.play();
    this.openR.play();
  },

  play: function() {
    this.data.leftHand.addEventListener("hand-pose", this.playAnimation);
    this.data.rightHand.addEventListener("hand-pose", this.playAnimation);
  },

  pause: function() {
    this.data.leftHand.removeEventListener("hand-pose", this.playAnimation);
    this.data.rightHand.removeEventListener("hand-pose", this.playAnimation);
  },

  tick: function(t, dt) {
    this.mixer.update(dt / 1000);
  },

  // Animate from pose to pose.
  // TODO: Transition from current pose (which may be BETWEEN two other poses)
  //       to the target pose, rather than stopping previous actions altogether.
  playAnimation: function(evt) {
    const isLeft = evt.target === this.data.leftHand;
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
    var from = mixer.clipAction(prevPose);
    var to = mixer.clipAction(currPose);
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
