import { paths } from "../systems/userinput/paths";

const grabberToPath = {
  "player-right-controller": paths.actions.rightHand.scaleGrabbedGrabbable,
  "player-left-controller": paths.actions.leftHand.scaleGrabbedGrabbable,
  cursor: paths.actions.cursor.scaleGrabbedGrabbable
};

AFRAME.registerComponent("scalable-when-grabbed", {
  tick: function() {
    const grabber = this.el.components.grabbable.grabbers[0];
    if (!grabber) return;

    const userinput = AFRAME.scenes[0].systems.userinput;
    const deltaScale = userinput.get(grabberToPath[grabber.id]);
    if (!deltaScale) return;

    this.el.object3D.scale.addScalar(deltaScale).clampScalar(0.01, 1000);
    this.el.object3D.matrixNeedsUpdate = true;
  }
});
