import { paths } from "../systems/userinput/paths";
/**
 * Manages ownership and haptics on an interatable
 * @namespace network
 * @component super-networked-interactable
 */
AFRAME.registerComponent("super-networked-interactable", {
  schema: {
    hapticsMassVelocityFactor: { default: 0.1 },
    counter: { type: "selector" },
    scrollScaleDelta: { default: 0.1 },
    minScale: { default: 0.1 },
    maxScale: { default: 100 }
  },

  init: function() {
    this.system = this.el.sceneEl.systems.physics;
    this.counter = this.data.counter.components["networked-counter"];
    this.hand = null;
    this.currentScale = new THREE.Vector3();
    this.currentScale.copy(this.el.getAttribute("scale"));

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.networkedEl = networkedEl;
      if (!NAF.utils.isMine(networkedEl)) {
        this.el.setAttribute("body", { type: "static" });
      } else {
        this.counter.register(networkedEl);
      }
    });

    this._stateAdded = this._stateAdded.bind(this);
    this._onGrabStart = this._onGrabStart.bind(this);
    this._onGrabEnd = this._onGrabEnd.bind(this);
    this._onOwnershipLost = this._onOwnershipLost.bind(this);
    this.el.addEventListener("grab-start", this._onGrabStart);
    this.el.addEventListener("grab-end", this._onGrabEnd);
    this.el.addEventListener("ownership-lost", this._onOwnershipLost);
    this.el.addEventListener("stateadded", this._stateAdded);
    this.system.addComponent(this);
  },

  remove: function() {
    this.counter.deregister(this.el);
    this.el.removeEventListener("grab-start", this._onGrabStart);
    this.el.removeEventListener("grab-end", this._onGrabEnd);
    this.el.removeEventListener("ownership-lost", this._onOwnershipLost);
    this.el.removeEventListener("stateadded", this._stateAdded);
    this.system.removeComponent(this);
  },

  _onGrabStart: function(e) {
    this.hand = e.detail.hand;
    this.hand.emit("haptic_pulse", { intensity: "high" });
    if (this.networkedEl && !NAF.utils.isMine(this.networkedEl)) {
      if (NAF.utils.takeOwnership(this.networkedEl)) {
        this.el.setAttribute("body", { type: "dynamic" });
        this.counter.register(this.networkedEl);
      } else {
        this.el.emit("grab-end", { hand: this.hand });
        this.hand = null;
      }
    }
    this.currentScale.copy(this.el.getAttribute("scale"));
  },

  _onGrabEnd: function(e) {
    if (e.detail.hand) e.detail.hand.emit("haptic_pulse", { intensity: "high" });
  },

  _onOwnershipLost: function() {
    this.el.setAttribute("body", { type: "static" });
    this.el.emit("grab-end", { hand: this.hand });
    this.hand = null;
    this.counter.deregister(this.el);
  },

  _changeScale: function(delta) {
    if (this.el.is("grabbed") && this.el.components.hasOwnProperty("stretchable")) {
      this.currentScale.addScalar(delta).clampScalar(this.data.minScale, this.data.maxScale);
      this.el.setAttribute("scale", this.currentScale);
      this.el.components["stretchable"].stretchBody(this.el, this.currentScale);
    }
  },

  tick: function() {
    const userinput = AFRAME.scenes[0].systems.userinput;
    const delta = userinput.readFrameValueAtPath(paths.actions.cursorScaleGrabbedGrabbable);
    if (delta) {
      this._changeScale(delta);
    }
  },
  _stateAdded(evt) {
    switch (evt.detail) {
      case "scaleUp":
        this._changeScale(-this.data.scrollScaleDelta);
        break;
      case "scaleDown":
        this._changeScale(this.data.scrollScaleDelta);
        break;
      default:
        break;
    }
  }
});
