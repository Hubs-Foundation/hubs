import { addComponent, removeComponent } from "bitecs";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { Pen, PenActive } from "../bit-components";
import { anyEntityWith } from "../utils/bit-utils";

// Used for tracking and managing pen tools in the scene
AFRAME.registerSystem("pen-tools", {
  init() {
    this.penEls = [];
    this.updateMyPen = this.updateMyPen.bind(this);

    waitForDOMContentLoaded().then(() => {
      this.updateMyPen();
    });
  },

  register(el) {
    this.penEls.push(el);
    el.addEventListener("ownership-changed", this.updateMyPen);
    this.updateMyPen();
  },

  deregister(el) {
    this.penEls.splice(this.penEls.indexOf(el), 1);
    el.removeEventListener("ownership-changed", this.updateMyPen);
    this.updateMyPen();
  },

  getMyPen() {
    return this.myPen;
  },

  updateMyPen() {
    this.myPen = this.penEls.find(NAF.utils.isMine);

    if (this.myPen) {
      this.sceneEl.addState("pen");
      addComponent(APP.world, PenActive, this.myPen.eid);
    } else {
      const pen = anyEntityWith(APP.world, Pen);
      if (pen) {
        removeComponent(APP.world, PenActive, pen);
      }
      this.sceneEl.removeState("pen");
    }
  }
});
