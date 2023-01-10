AFRAME.registerComponent("accessibility", {
    tock() {
      this.el.setAttribute("aria-description", this.data["dc:description"]);
      this.el.setAttribute("aria-label", this.data["dc:title"]);
      this.el.setAttribute("tabindex","0");
    }
  })