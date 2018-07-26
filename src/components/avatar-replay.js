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
    rightController: { type: "selector" },
    recordingUrl: { type: "string" }
  },
  init: function() {
    this.modelLoaded = new Promise(resolve => this.el.addEventListener("model-loaded", resolve));
  },

  update: function() {
    const { camera, leftController, rightController, recordingUrl } = this.data;
    if (!recordingUrl) {
      return;
    }

    const fetchRecording = fetch(recordingUrl).then(resp => resp.json());
    camera.setAttribute("motion-capture-replayer", { loop: true });
    this._setupController(leftController);
    this._setupController(rightController);

    this.dataLoaded = Promise.all([fetchRecording, this.modelLoaded]).then(([recording]) => {
      const cameraReplayer = camera.components["motion-capture-replayer"];
      cameraReplayer.startReplaying(recording.camera);
      const leftControllerReplayer = leftController.components["motion-capture-replayer"];
      leftControllerReplayer.startReplaying(recording.left);
      const rightControllerReplayer = rightController.components["motion-capture-replayer"];
      rightControllerReplayer.startReplaying(recording.right);
    });
  },

  _setupController: function(controller) {
    controlsBlacklist.forEach(controlsComponent => controller.removeAttribute(controlsComponent));
    controller.setAttribute("visible", true);
    controller.setAttribute("motion-capture-replayer", { loop: true });
  }
});
