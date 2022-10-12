import { addComponent, hasComponent } from "bitecs";
import {
  Holdable,
  OffersRemoteConstraint,
  HandCollisionTarget,
  OffersHandConstraint,
  TogglesHoveredActionSet,
  SingleActionButton,
  HoldableButton,
  Pen,
  HoverMenuChild,
  Static,
  Inspectable,
  PreventAudioBoost,
  IgnoreSpaceBubble
} from "../bit-components";

const tag2ecs = {
  isHoldable: Holdable,
  offersRemoteConstraint: OffersRemoteConstraint,
  isHandCollisionTarget: HandCollisionTarget,
  offersHandConstraint: OffersHandConstraint,
  togglesHoveredActionSet: TogglesHoveredActionSet,
  singleActionButton: SingleActionButton,
  holdableButton: HoldableButton,
  isPen: Pen,
  isHoverMenuChild: HoverMenuChild,
  isStatic: Static,
  inspectable: Inspectable,
  preventAudioBoost: PreventAudioBoost,
  ignoreSpaceBubble: IgnoreSpaceBubble
};

// TODO usages of this should be replaced with direct hasComponent calls
// but this also has additional logic to check for non existant object
export function isTagged(elOrObject3D, tag) {
  return elOrObject3D && hasComponent(APP.world, tag2ecs[tag], elOrObject3D.eid);
}

AFRAME.registerComponent("tags", {
  schema: {
    isHandCollisionTarget: { default: false },
    isHoldable: { default: false },
    offersHandConstraint: { default: false },
    offersRemoteConstraint: { default: false },
    togglesHoveredActionSet: { default: false },
    singleActionButton: { default: false },
    holdableButton: { default: false },
    isPen: { default: false },
    isHoverMenuChild: { default: false },
    isStatic: { default: false },
    inspectable: { default: false },
    preventAudioBoost: { default: false },
    ignoreSpaceBubble: { default: false }
  },
  update() {
    if (this.didUpdateOnce) {
      console.warn("Do not edit tags with .setAttribute");
    }
    this.didUpdateOnce = true;
    Object.entries(this.data).forEach(([tagName, isSet]) => {
      if (isSet) addComponent(APP.world, tag2ecs[tagName], this.el.eid);
    });
  }
});
