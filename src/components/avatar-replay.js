import botRecording from "../assets/avatars/bot-recording.json";

// These controls are removed from the controller entities so that motion-capture-replayer is in full control of them.
const controlsBlacklist = [
  "tracked-controls",
  "hand-controls2",
  "vive-controls",
  "oculus-touch-controls",
  "windows-motion-controls",
  "daydream-controls",
  "gearvr-controls"
];

/**
 * Replays a recorded motion capture with the given avatar body parts
 * @namespace avatar
 * @component avatar-replay
 */
AFRAME.registerComponent("avatar-replay", {
  schema: {
    camera: { type: "selector" },
    leftController: { type: "selector" },
    rightController: { type: "selector" }
  },
  init: function() {
    const { camera, leftController, rightController } = this.data;

    camera.setAttribute("motion-capture-replayer", { loop: true });
    this._setupController(leftController);
    this._setupController(rightController);

    this.el.addEventListener("model-loaded", () => {
      const cameraReplayer = camera.components["motion-capture-replayer"];
      cameraReplayer.startReplaying(botRecording.camera);
      const leftControllerReplayer = leftController.components["motion-capture-replayer"];
      leftControllerReplayer.startReplaying(botRecording.left);
      const rightControllerReplayer = rightController.components["motion-capture-replayer"];
      rightControllerReplayer.startReplaying(botRecording.right);
    });
  },
  _setupController: function(controller) {
    controlsBlacklist.forEach(controlsComponent => controller.removeAttribute(controlsComponent));
    controller.setAttribute("visible", true);
    controller.setAttribute("motion-capture-replayer", { loop: true });
  }
});
