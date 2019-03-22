const ACTIVATION_STATES = require("aframe-physics-system/src/constants").ACTIVATION_STATES;
import { EVENT_TYPE_CONSTRAINT_CREATION_ATTEMPT, EVENT_TYPE_CONSTRAINT_REMOVAL } from "../systems/interactions.js";

/**
 * Manages ownership and haptics on an interatable
 * @namespace network
 * @component super-networked-interactable
 */
AFRAME.registerComponent("super-networked-interactable", {
  schema: {
    counter: { type: "selector" }
  },

  init: function() {
    this.counter = this.data.counter.components["networked-counter"];

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.networkedEl = networkedEl;
      this._syncCounterRegistration();
      if (!NAF.utils.isMine(networkedEl)) {
        this.el.setAttribute("ammo-body", { type: "kinematic", addCollideEventListener: true });
      } else {
        this.counter.register(networkedEl);
      }
    });

    this._onOwnershipLost = this._onOwnershipLost.bind(this);
    this._syncCounterRegistration = this._syncCounterRegistration.bind(this);
    this.el.addEventListener("pinned", this._syncCounterRegistration);
    this.el.addEventListener("unpinned", this._syncCounterRegistration);
    this.el.addEventListener("ownership-lost", this._onOwnershipLost);
    this.onGrabStart = this.onGrabStart.bind(this);
    this.onGrabEnd = this.onGrabEnd.bind(this);
  },

  play: function() {
    this.el.object3D.addEventListener(EVENT_TYPE_CONSTRAINT_CREATION_ATTEMPT, this.onGrabStart);
    this.el.object3D.addEventListener(EVENT_TYPE_CONSTRAINT_REMOVAL, this.onGrabEnd);
  },

  pause: function() {
    this.el.object3D.removeEventListener(EVENT_TYPE_CONSTRAINT_CREATION_ATTEMPT, this.onGrabStart);
    this.el.object3D.removeEventListener(EVENT_TYPE_CONSTRAINT_REMOVAL, this.onGrabEnd);
  },

  remove: function() {
    this.counter.deregister(this.el);
    this.el.removeEventListener("ownership-lost", this._onOwnershipLost);
  },

  onGrabStart: function() {
    if (this.networkedEl) {
      if (!NAF.utils.isMine(this.networkedEl)) {
        if (NAF.utils.takeOwnership(this.networkedEl)) {
          this.el.setAttribute("ammo-body", { type: "dynamic" });
          this.el.body.forceActivationState(ACTIVATION_STATES.DISABLE_DEACTIVATION);
          this._syncCounterRegistration();
        } else {
          // TODO: If you can't take ownership, a constraint should not be created and we should communicate the error to the user
        }
      } else {
        this.el.body.forceActivationState(ACTIVATION_STATES.DISABLE_DEACTIVATION);
      }
    }
  },

  onGrabEnd: function() {
    this.el.body.forceActivationState(ACTIVATION_STATES.ACTIVE_TAG);
  },

  _onOwnershipLost: function() {
    this.el.setAttribute("ammo-body", { type: "kinematic" });
    //TODO: Communicate ownership lost to interaction system
    this._syncCounterRegistration();
  },

  _syncCounterRegistration: function() {
    const el = this.networkedEl;
    if (!el || !el.components["networked"]) return;

    const isPinned = el.components["pinnable"] && el.components["pinnable"].data.pinned;

    if (NAF.utils.isMine(el) && !isPinned) {
      this.counter.register(el);
    } else {
      this.counter.deregister(el);
    }
  }
});
