// Goal 1: When the cursor intersects an object, I want to change action sets depending on the component on the object.
import { sets } from "./userinput/sets";

const PREP_GRAB = "prep-grab";
AFRAME.registerComponent(PREP_GRAB, {
  init: function() {
    this.prepped = false;
  }
});

AFRAME.registerSystem("interaction", {
  updateCursorIntersections: function(current, previous, raw) {
    if (previous && previous.object.el.components[PREP_GRAB]) {
      previous.components[PREP_GRAB].prepped = false;
      AFRAME.scenes[0].systems.userinput.toggleSet(sets.cursorHoveringOnInteractable, false);
    }

    if (!current) return;

    // For the ducky, the object we intersect is assigned an entity,
    // but not the interactable-media entity with the relevant PREP_GRAB component assigned in the html.
    // We have to climb to that el's parentEl.parentEl.parentEl.
    // However, it's not like we can always do this. For spawned images, such an el is undefined.
    // I have not found a way to reconcile this.
    const prepGrab = current && (current.object.el.parentEl.parentEl.parentEl.components[PREP_GRAB]);
    if (prepGrab) {
      AFRAME.scenes[0].systems.userinput.toggleSet(sets.cursorHoveringOnInteractable, true);
      prepGrab.prepped = true;
    }
  }
});
