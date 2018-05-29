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

/**
 * Animates between poses based on networked pose state using an animation mixer.
 * @namespace avatar
 * @component hand-pose
 */
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

    const getNetworkedAvatar = el => {
      const networkedAvatar = el.components["networked-avatar"];
      if (networkedAvatar) {
        return networkedAvatar;
      }
      return getNetworkedAvatar(el.parentEl);
    };
    this.networkedAvatar = getNetworkedAvatar(this.el);
  },

  tick() {
    if (
      !this.networkedAvatar ||
      !this.networkedAvatar.data ||
      this.networkedAvatar.data[`${this.id}_hand_pose`] === this.pose
    ) {
      return;
    }

    this.animatePose(NETWORK_POSES[this.pose], NETWORK_POSES[this.networkedAvatar.data[`${this.id}_hand_pose`]]);
    this.pose = this.networkedAvatar.data[`${this.id}_hand_pose`];
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

/**
 * Sets the networked hand pose state based on hand-pose events.
 * @namespace avatar
 * @component hand-pose-controller
 */
AFRAME.registerComponent("hand-pose-controller", {
  multiple: true,
  schema: {
    eventSrc: { type: "selector" },
    networkedAvatar: { type: "selector" }
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
    this.data.networkedAvatar.setAttribute(
      "networked-avatar",
      `${this.id}_hand_pose`,
      NETWORK_POSES.indexOf(POSES[evt.detail.current])
    );
  }
});
