AFRAME.registerComponent("remote-dynamic-body", {

  init: function() {
    this.networkedEl = NAF.utils.getNetworkedEntity(this.el);

    if (!this._isMine()) {
      this.networkedEl.setAttribute("dynamic-body", "mass: 0;");
      this.networkedEl.setAttribute("grabbable", "");
      this.networkedEl.setAttribute("stretchable", "");
      this.el.setAttribute("color", "white");
    }

    this.wasMine = this._isMine();

    const self = this;

    this.networkedEl.addEventListener('grab-start', function(e){
      if (!self._isMine()) {
        if(self.networkedEl.components.networked.takeOwnership()) {
          self.networkedEl.components["dynamic-body"].updateMass(1);
          self.el.setAttribute("color", "green");
          self.wasMine = true;
        }
      }
    });
  },

  tick: function(t) {
    if(this.wasMine && !this._isMine()) {
      this.wasMine = false;
      this.networkedEl.components["dynamic-body"].updateMass(0);
      this.el.setAttribute("color", "white");
      this.networkedEl.components["grabbable"].resetGrabber();
    }
  },

  _isMine: function() {
    return this.networkedEl.components.networked.isMine();
  }
});
