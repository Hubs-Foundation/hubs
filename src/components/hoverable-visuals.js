import { forEachMaterial } from "../utils/material-utils";
import { showHoverEffect } from "../utils/permissions-utils";

const interactorOneTransform = [];
const interactorTwoTransform = [];

export const validMaterials = ["MeshStandardMaterial", "MeshBasicMaterial", "MeshPhongMaterial"];
/**
 * Applies effects to a hoverable based on hover state.
 * @namespace interactables
 * @component hoverable-visuals
 */
AFRAME.registerComponent("hoverable-visuals", {
  schema: {
    enableSweepingEffect: { type: "boolean", default: true }
  },
  init() {
    // uniforms and boundingSphere are set from the component responsible for loading the mesh.
    this.uniforms = null;
    this.geometryRadius = 0;

    this.sweepParams = [0, 0];
  },
  remove() {
    this.uniforms = null;
    this.boundingBox = null;

    const isMobile = AFRAME.utils.device.isMobile();
    const isMobileVR = AFRAME.utils.device.isMobileVR();
    this.isTouchscreen = isMobile && !isMobileVR;
  },
  tick(time) {
    if (!this.uniforms || !this.uniforms.length) return;

    const isFrozen = this.el.sceneEl.is("frozen");
    const showEffect = showHoverEffect(this.el);
    const toggling = this.el.sceneEl.systems["hubs-systems"].cursorTogglingSystem;

    let interactorOne, interactorTwo;
    const interaction = this.el.sceneEl.systems.interaction;
    if (!interaction.ready) return; //DOMContentReady workaround
    if (interaction.state.leftHand.hovered === this.el && !interaction.state.leftHand.held) {
      interactorOne = interaction.options.leftHand.entity.object3D;
    }
    if (
      interaction.state.leftRemote.hovered === this.el &&
      !interaction.state.leftRemote.held &&
      !toggling.leftToggledOff
    ) {
      interactorOne = interaction.options.leftRemote.entity.object3D;
    }
    if (
      interaction.state.rightRemote.hovered === this.el &&
      !interaction.state.rightRemote.held &&
      !toggling.rightToggledOff
    ) {
      interactorTwo = interaction.options.rightRemote.entity.object3D;
    }
    if (interaction.state.rightHand.hovered === this.el && !interaction.state.rightHand.held) {
      interactorTwo = interaction.options.rightHand.entity.object3D;
    }

    if (interactorOne) {
      interactorOne.matrixWorld.toArray(interactorOneTransform);
    }
    if (interactorTwo) {
      interactorTwo.matrixWorld.toArray(interactorTwoTransform);
    }

    if (interactorOne || interactorTwo || isFrozen) {
      const worldY = this.el.object3D.matrixWorld.elements[13];
      const ms1 = this.el.object3D.matrixWorld.elements[4];
      const ms2 = this.el.object3D.matrixWorld.elements[5];
      const ms3 = this.el.object3D.matrixWorld.elements[6];
      const worldScale = Math.sqrt(ms1 * ms1 + ms2 * ms2 + ms3 * ms3);
      const scaledRadius = worldScale * this.geometryRadius;
      this.sweepParams[0] = worldY - scaledRadius;
      this.sweepParams[1] = worldY + scaledRadius;
    }

    for (let i = 0, l = this.uniforms.length; i < l; i++) {
      const uniform = this.uniforms[i];
      uniform.hubs_EnableSweepingEffect.value = this.data.enableSweepingEffect && showEffect;
      uniform.hubs_IsFrozen.value = isFrozen;
      uniform.hubs_SweepParams.value = this.sweepParams;

      uniform.hubs_HighlightInteractorOne.value = !!interactorOne && showEffect && !this.isTouchscreen;
      uniform.hubs_InteractorOnePos.value[0] = interactorOneTransform[12];
      uniform.hubs_InteractorOnePos.value[1] = interactorOneTransform[13];
      uniform.hubs_InteractorOnePos.value[2] = interactorOneTransform[14];

      uniform.hubs_HighlightInteractorTwo.value = !!interactorTwo && showEffect && !this.isTouchscreen;
      uniform.hubs_InteractorTwoPos.value[0] = interactorTwoTransform[12];
      uniform.hubs_InteractorTwoPos.value[1] = interactorTwoTransform[13];
      uniform.hubs_InteractorTwoPos.value[2] = interactorTwoTransform[14];

      if (interactorOne || interactorTwo || isFrozen) {
        uniform.hubs_Time.value = time;
      }
    }
  }
});
