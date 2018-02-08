// Global THREE, AFRAME
const robotGestures = {
  open: "pinch", //TODO
  point: "point",
  pointThumb: "point",
  fist: "grip",
  hold: "grip",
  thumbUp: "thumbup"
};

AFRAME.registerComponent("robot-hand-gestures", {
  schema: {
    leftHand: { type: "selector", default: "#left-hand" },
    rightHand: { type: "selector", default: "#right-hand" }
  },

  init: function() {
    this.playAnimation = this.playAnimation.bind(this);
    this.onModelLoaded = this.onModelLoaded.bind(this);
    this.el.addEventListener("model-loaded", this.onModelLoaded);
  },

  onModelLoaded: function() {
    var root = this.el.object3D.children[0].children[0].children[0]; // The "Root Scene" in threejs land of type "Scene"
    console.log(this.el);
    this.mixer = new THREE.AnimationMixer(root);
    this.loaded = true;
  },

  play: function() {
    this.data.leftHand.addEventListener("hand-gesture", this.playAnimation);
    this.data.rightHand.addEventListener("hand-gesture", this.playAnimation);
  },

  pause: function() {
    this.data.leftHand.removeEventListener("hand-gesture", this.playAnimation);
    this.data.rightHand.removeEventListener("hand-gesture", this.playAnimation);
  },

  tick: function(_t, dt) {
    if (!this.loaded) return;
    this.mixer.update(dt * 0.001);
  },

  /**
  * Play hand animation based on button state.
  *
  * @param {string} gesture - Name of the animation as specified by the model.
  * @param {string} lastGesture - Previous pose.
  */
  playAnimation: function(evt) {
    const { current, previous } = evt.detail;
    var fromAction;
    var toAction;
    var mixer = this.mixer;
    const suffix = evt.target === this.data.leftHand ? "_L" : "_R";
    const from = robotGestures[previous] + suffix;
    const to = robotGestures[current] + suffix;

    // Grab clip action.
    toAction = mixer.clipAction(to);
    toAction.clampWhenFinished = true;
    //    toAction.loop = THREE.LoopRepeat;
    toAction.repetitions = 0;
    toAction.weight = 1;

    // No gesture to gesture or gesture to no gesture.
    if (!previous || current === previous) {
      // Stop all current animations.
      mixer.stopAllAction();

      // Play animation.
      toAction.play();
      return;
    }

    // Animate or crossfade from gesture to gesture.

    fromAction = mixer.clipAction(from);
    mixer.stopAllAction();
    fromAction.weight = 0.15;
    fromAction.play();
    toAction.play();
    fromAction.crossFadeTo(toAction, 0.15, true);
  }
});
