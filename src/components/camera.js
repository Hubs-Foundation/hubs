AFRAME.registerComponent("stabilize-camera", {
  init: function () {
    this.el.addEventListener("grab-start", (evt) => {
      if (!NAF.utils.isMine(this.el)) {
        console.warn("Cannot interact: you do not own this camera.");
        evt.stopImmediatePropagation();
        evt.preventDefault();
      }
    });

    this.el.addEventListener("grab-move", (evt) => {
      if (!NAF.utils.isMine(this.el)) {
        evt.stopImmediatePropagation();
        evt.preventDefault();
      }
    });

    this.el.addEventListener("grab-end", (evt) => {
      if (!NAF.utils.isMine(this.el)) {
        evt.stopImmediatePropagation();
        evt.preventDefault();
      }
    });
  }
});

