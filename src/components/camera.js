AFRAME.registerComponent("stabilize-camera", {
  init() {
    if (!this.el.hasAttribute("networked")) return;

    const checkOwnership = () => NAF && NAF.utils.isMine(this.el);

    this.el.addEventListener("grab-start", () => {
      if (!checkOwnership()) {
        // Prevent others from manipulating the camera
        console.warn("[Camera] Grab blocked - not owned by this user.");
        this.el.setAttribute("body", "type: static"); // Or disable interactivity
      }
    });

    this.el.addEventListener("grab-end", () => {
      if (!checkOwnership()) {
        // Restore original behavior if needed
        this.el.setAttribute("body", "type: dynamic");
      }
    });
  }
});

