import { paths } from "../systems/userinput/paths";
import { SOUND_FREEZE, SOUND_THAW } from "../systems/sound-effects-system";
import { CAMERA_MODE_INSPECT } from "../systems/camera-system";

/**
 * Toggles freezing of network traffic on the given event.
 * @namespace network
 * @component freeze-controller
 */
AFRAME.registerComponent("freeze-controller", {
  init: function() {
    this.onToggle = this.onToggle.bind(this);
  },

  tick: function() {
    const scene = this.el.sceneEl;
    if (!scene.is("entered")) return;
    const inspecting = scene.systems["hubs-systems"].cameraSystem.mode === CAMERA_MODE_INSPECT;
    if (inspecting) {
      if (this.el.is("frozen")) {
        this.onToggle();
      }
      if (!NAF.connection.adapter.frozen) {
        NAF.connection.adapter.toggleFreeze();
      }
      this.wasInspecting = true;
    } else if (this.wasInspecting) {
      if (NAF.connection.adapter.frozen) {
        NAF.connection.adapter.toggleFreeze();
      }
      this.wasInspecting = false;
    } else {
      const userinput = scene.systems.userinput;
      const ensureFrozen = userinput.get(paths.actions.ensureFrozen);
      const thaw = userinput.get(paths.actions.thaw);
      const toggleFreeze = userinput.get(paths.actions.toggleFreeze);

      const toggleFreezeDueToInput =
        (this.el.is("frozen") && thaw) || (!this.el.is("frozen") && ensureFrozen) || toggleFreeze;

      if (toggleFreezeDueToInput) {
        this.onToggle();
      }
    }
  },

  onToggle: function() {
    window.APP.store.update({ activity: { hasFoundFreeze: true } });
    if (!NAF.connection.adapter) return;
    NAF.connection.adapter.toggleFreeze();
    if (NAF.connection.adapter.frozen) {
      this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_FREEZE);
      this.el.addState("frozen");
    } else {
      this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_THAW);
      this.el.removeState("frozen");
    }
  }
});
