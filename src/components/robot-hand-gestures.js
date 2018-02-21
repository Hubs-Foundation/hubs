// Global THREE, AFRAME
const robotGestures = {
  open: "grip", //TODO
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
    this.leftMixer = new THREE.AnimationMixer(root);
    this.rightMixer = new THREE.AnimationMixer(root);

    window.root = root; //TODO delete
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
    this.leftMixer.update(dt);
    this.rightMixer.update(dt);
  },

  playAnimation: function(evt) {
    if (!this.loaded) return;
    const { current, previous } = evt.detail;
    var mixer = this.data.leftHand ? this.leftMixer : this.rightMixer;
    const suffix = evt.target === this.data.leftHand ? "_L" : "_R";
    const prevPose = robotGestures[previous] + suffix;
    const currPose = robotGestures[current] + suffix;

    // Animate or crossfade from gesture to gesture.
    //console.log(`Animate from ${prevPose} to ${currPose}`);
    const duration = 300;
    var from = mixer.clipAction(prevPose);
    from.setDuration(duration);
    var to = mixer.clipAction(currPose);
    to.setDuration(duration);
    to = to.crossFadeFrom(from, duration);

    mixer.stopAllAction();
    if (this["gesture" + suffix] !== undefined) {
    }
    to.play();

    this["gesture" + suffix] = to;
  }
});
