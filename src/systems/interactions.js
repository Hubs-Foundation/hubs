import { paths } from "./userinput/paths";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { isTagged } from "../components/tags";
import { hasComponent } from "bitecs";
import { anyEntityWith } from "../utils/bit-utils";

import {
  HoveredRemoteRight,
  HoveredRemoteLeft,
  HoveredHandRight,
  HoveredHandLeft,
  HeldRemoteRight,
  HeldRemoteLeft,
  HeldHandRight,
  HeldHandLeft,
  AEntity
} from "../bit-components";

function anyAframeEntityWith(world, component) {
  const eid = anyEntityWith(world, component);
  return eid && hasComponent(world, AEntity, eid) && world.eid2obj.get(eid).el;
}
export function isUI(el) {
  return isTagged(el, "singleActionButton") || isTagged(el, "holdableButton");
}

function identityFn(o) {
  return o;
}

AFRAME.registerSystem("interaction", {
  getActiveIntersection() {
    return (
      (this.state.rightRemote.hovered && this.rightCursorControllerEl.components["cursor-controller"].intersection) ||
      (this.state.leftRemote.hovered && this.leftCursorControllerEl.components["cursor-controller"].intersection)
    );
  },

  isHoldingAnything(pred = identityFn) {
    return !!(
      pred(this.state.leftHand.held) ||
      pred(this.state.rightHand.held) ||
      pred(this.state.rightRemote.held) ||
      pred(this.state.leftRemote.held)
    );
  },

  isHeld(el) {
    return (
      this.state.leftHand.held === el ||
      this.state.rightHand.held === el ||
      this.state.rightRemote.held === el ||
      this.state.leftRemote.held === el
    );
  },

  init: function () {
    this.options = {
      leftHand: {
        entity: null,
        grabPath: paths.actions.leftHand.grab,
        dropPath: paths.actions.leftHand.drop
      },
      rightHand: {
        entity: null,
        grabPath: paths.actions.rightHand.grab,
        dropPath: paths.actions.rightHand.drop
      },
      rightRemote: {
        entity: null,
        grabPath: paths.actions.cursor.right.grab,
        dropPath: paths.actions.cursor.right.drop
      },
      leftRemote: {
        entity: null,
        grabPath: paths.actions.cursor.left.grab,
        dropPath: paths.actions.cursor.left.drop
      }
    };
    this.state = {
      leftHand: {
        hovered: null,
        held: null
      },
      rightHand: {
        hovered: null,
        held: null
      },
      rightRemote: {
        hovered: null,
        held: null
      },
      leftRemote: {
        hovered: null,
        held: null
      }
    };
    this.previousState = {
      leftHand: {
        hovered: null,
        held: null
      },
      rightHand: {
        hovered: null,
        held: null
      },
      rightRemote: {
        hovered: null,
        held: null
      },
      leftRemote: {
        hovered: null,
        held: null
      }
    };
    waitForDOMContentLoaded().then(() => {
      this.options.leftHand.entity = document.getElementById("player-left-controller");
      this.options.rightHand.entity = document.getElementById("player-right-controller");
      this.options.rightRemote.entity = document.getElementById("right-cursor");
      this.options.leftRemote.entity = document.getElementById("left-cursor");
      this.rightCursorControllerEl = document.getElementById("right-cursor-controller");
      this.leftCursorControllerEl = document.getElementById("left-cursor-controller");
      this.ready = true;
    });
  },

  updateLegacyState() {
    this.previousState.rightRemote.hovered = this.state.rightRemote.hovered;
    this.previousState.rightRemote.held = this.state.rightRemote.held;
    this.previousState.leftRemote.hovered = this.state.leftRemote.hovered;
    this.previousState.leftRemote.held = this.state.leftRemote.held;
    this.previousState.leftHand.hovered = this.state.leftHand.hovered;
    this.previousState.leftHand.held = this.state.leftHand.held;
    this.previousState.rightHand.hovered = this.state.rightHand.hovered;
    this.previousState.rightHand.held = this.state.rightHand.held;

    const world = APP.world;
    this.state.rightRemote.hovered = anyAframeEntityWith(world, HoveredRemoteRight);
    this.state.leftRemote.hovered = anyAframeEntityWith(world, HoveredRemoteLeft);
    this.state.rightHand.hovered = anyAframeEntityWith(world, HoveredHandRight);
    this.state.leftHand.hovered = anyAframeEntityWith(world, HoveredHandLeft);
    this.state.rightRemote.held = anyAframeEntityWith(world, HeldRemoteRight);
    this.state.leftRemote.held = anyAframeEntityWith(world, HeldRemoteLeft);
    this.state.rightHand.held = anyAframeEntityWith(world, HeldHandRight);
    this.state.leftHand.held = anyAframeEntityWith(world, HeldHandLeft);
  }
});
