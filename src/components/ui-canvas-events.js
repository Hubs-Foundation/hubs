AFRAME.registerComponent("ui-canvas-events", {
  schema: {
    /*image: { type: "string" },
    hoverImage: { type: "string" },
    activeImage: { type: "string" },
    activeHoverImage: { type: "string" },
    active: { type: "boolean" },
    haptic: { type: "selector" },
    tooltip: { type: "selector" },
    tooltipText: { type: "string" },
    activeTooltipText: { type: "string" }*/
  },

  init() {
    console.log("start");
    this.onClick = e => {
      console.log(e);
    };
  },

  play() {
    //this.el.addEventListener("mouseover", this.onHover);
    //this.el.addEventListener("mouseout", this.onHoverOut);
    this.el.addEventListener("click", this.onClick);
  },

  pause() {
    //this.el.removeEventListener("mouseover", this.onHover);
    //this.el.removeEventListener("mouseout", this.onHoverOut);
    this.el.removeEventListener("click", this.onClick);
  }
});
