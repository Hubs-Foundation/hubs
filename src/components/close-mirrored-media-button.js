export function closeExistingMediaMirror() {
  const mirrorTarget = document.querySelector("#media-mirror-target");

  // Remove old mirror target media element
  if (mirrorTarget.firstChild) {
    mirrorTarget.firstChild.setAttribute("animation__remove", {
      property: "scale",
      dur: 200,
      to: { x: 0.01, y: 0.01, z: 0.01 },
      easing: "easeInQuad"
    });

    return new Promise(res => {
      mirrorTarget.firstChild.addEventListener("animationcomplete", () => {
        mirrorTarget.removeChild(mirrorTarget.firstChild);
        res();
      });
    });
  }
}

AFRAME.registerComponent("close-mirrored-media-button", {
  init() {
    this.onClick = async () => {
      this.el.object3D.visible = false; // Hide button immediately on click
      await closeExistingMediaMirror();

      const mirrorTarget = document.querySelector("#media-mirror-target");
      mirrorTarget.parentEl.object3D.visible = false;
      this.el.object3D.visible = true;
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
