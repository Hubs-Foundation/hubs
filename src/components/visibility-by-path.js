AFRAME.registerComponent("visibility-by-path", {
  schema: {
    path: { type: "string" }
  },
  tick() {
    const userinput = AFRAME.scenes[0].systems.userinput;
    const shouldBeVisible = !!userinput.get(this.data.path);
    if (this.el.object3D.visible !== shouldBeVisible) {
      this.el.setAttribute("visible", shouldBeVisible);
    }
  }
});
