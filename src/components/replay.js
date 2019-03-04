AFRAME.registerComponent("replay", {
  init: function() {
    this.playhead = 0;
    this.poseIndex = 0;
  },

  tick: function(t, dt) {
    let overflow = false;
    while (!overflow && this.playhead >= this.poses[this.poseIndex].timestamp) {
      this.el.setAttribute("position", this.poses[this.poseIndex].position);
      this.el.setAttribute("rotation", this.poses[this.poseIndex].rotation);
      this.el.object3D.matrixNeedsUpdate = true;
      this.poseIndex += 1;
      overflow = this.poseIndex === this.poses.length;
    }

    this.playhead += dt;

    if (overflow) {
      this.playhead = 0;
      this.poseIndex = 0;
    }
  }
});
