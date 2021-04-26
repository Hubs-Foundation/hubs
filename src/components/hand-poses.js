import { LoopOnce } from "three/src/constants";
import { findAncestorWithComponent } from "../utils/scene-graph";

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
    const mixerEl = findAncestorWithComponent(this.el, "animation-mixer");
    const suffix = this.id == "left" ? "_L" : "_R";
    this.mixer = mixerEl && mixerEl.components["animation-mixer"].mixer;
    if (!this.mixer || !this.mixer.clipAction(POSES.open + suffix)) {
      console.warn("Avatar does not an 'allOpen' animation, disabling hand animations");
      this.el.removeAttribute("hand-pose");
      return;
    }
    this.from = this.to = this.mixer.clipAction(POSES.open + suffix);
    this.from.play();
    this.networkField = `${this.id}_hand_pose`;

    const getNetworkedAvatar = el => {
      if (!el) {
        window.setTimeout(() => {
          getNetworkedAvatar(this.el);
        }, 1000);
        return;
      }
      const networkedAvatar = el.components && el.components["networked-avatar"];
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
      this.networkedAvatar.data[this.networkField] === this.pose
    ) {
      return;
    }

    this.animatePose(NETWORK_POSES[this.pose], NETWORK_POSES[this.networkedAvatar.data[this.networkField]]);
    this.pose = this.networkedAvatar.data[this.networkField];
  },

  animatePose(prev, curr) {
    if (this.from) {
      this.from.stop();
    }
    if (this.to) {
      this.to.stop();
    }

    const duration = 0.065;
    const suffix = this.id == "left" ? "_L" : "_R";
    this.from = this.mixer.clipAction(prev + suffix);
    this.to = this.mixer.clipAction(curr + suffix);
    if (this.from) {
      this.from.setLoop(LoopOnce, -1);
      this.from.clampWhenFinished = true;
      this.from.fadeOut(duration);
      this.from.play();
    }
    if (this.to) {
      this.to.setLoop(LoopOnce, -1);
      this.to.clampWhenFinished = true;
      this.to.fadeIn(duration);
      this.to.play();
    }

    this.mixer.update(0.001);
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
