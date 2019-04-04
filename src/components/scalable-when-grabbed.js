import { paths } from "../systems/userinput/paths";

AFRAME.registerComponent("scalable-when-grabbed", {
  tick: function() {
    const userinput = AFRAME.scenes[0].systems.userinput;
    const interaction = AFRAME.scenes[0].systems.interaction;
    if (interaction.state.rightRemote.held !== this.el) return;
    const deltaScale = userinput.get(paths.actions.cursor.scaleGrabbedGrabbable);
    if (!deltaScale) return;

    this.el.object3D.scale.addScalar(deltaScale).clampScalar(0.1, 100);
    this.el.object3D.matrixNeedsUpdate = true;
  }
});
