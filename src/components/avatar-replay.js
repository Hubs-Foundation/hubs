// These controls are removed from the controller entities so that motion-capture-replayer is in full control of them.
const disallowedControls = [
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

  init: function () {
    console.log("avatar replay init");
    this.modelLoaded = new Promise(resolve => this.el.addEventListener("model-loaded", resolve));
  },

  update: function () {
    console.log("avatar replay updated: " + this.data.recordingUrl);
    const { camera, leftController, rightController, recordingUrl } = this.data;
    if (!recordingUrl) {
      return;
    }

    console.log("Fetching recording.");
    const fetchRecording = fetch(recordingUrl).then(resp => resp.json());
    camera.setAttribute("motion-capture-replayer", { loop: true });
    this._setupController(leftController);
    this._setupController(rightController);
    console.log("Waiting for recording to load.");

    this.dataLoaded = Promise.all([fetchRecording, this.modelLoaded]).then(([recording]) => {
      console.log(
        `Recording ready [${recording.camera.poses.length} cam/${recording.left && recording.left.poses.length} left/${
          recording.right && recording.right.poses.length
        } right] replaying traffic.`
      );
      const cameraReplayer = camera.components["motion-capture-replayer"];
      cameraReplayer.startReplaying(recording.camera);
      const leftControllerReplayer = leftController.components["motion-capture-replayer"];
      leftControllerReplayer.startReplaying(recording.left);
      const rightControllerReplayer = rightController.components["motion-capture-replayer"];
      rightControllerReplayer.startReplaying(recording.right);
      console.log("Replay begun.");
    });
  },

  _setupController: function (controller) {
    disallowedControls.forEach(controlsComponent => controller.removeAttribute(controlsComponent));
    controller.setAttribute("visible", true);
    controller.setAttribute("motion-capture-replayer", { loop: true });
  }
});
