import botRecording from "../assets/avatars/bot-recording.json";

AFRAME.registerComponent("avatar-replay", {
  init: function() {
    const camera = this.el.querySelector("#player-camera");
    const leftController = this.el.querySelector("#player-left-controller");
    const rightController = this.el.querySelector("#player-right-controller");

    camera.setAttribute("motion-capture-replayer", { loop: true });
    this._setupController(leftController);
    this._setupController(rightController);

    this.el.addEventListener("model-loaded", () => {
      console.log("BPDEBUG avatar replay model loaded", );
      const cameraReplayer = camera.components["motion-capture-replayer"];
      cameraReplayer.startReplaying(botRecording.camera);
      const leftControllerReplayer = leftController.components["motion-capture-replayer"];
      leftControllerReplayer.startReplaying(botRecording.left);
      const rightControllerReplayer = rightController.components["motion-capture-replayer"];
      rightControllerReplayer.startReplaying(botRecording.right);
    });
  },
  _setupController: function(controller) {
    controller.removeAttribute("tracked-controls");
    controller.removeAttribute("hand-controls2");
    controller.removeAttribute("vive-controls");
    controller.removeAttribute("oculus-touch-controls");
    controller.removeAttribute("windows-motion-controls");
    controller.removeAttribute("daydream-controls");
    controller.removeAttribute("gearvr-controls");
    controller.setAttribute("visible", true);
    controller.setAttribute("motion-capture-replayer", { loop: true });
  }
});
