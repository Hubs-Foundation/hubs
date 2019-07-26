import { forEachMaterial } from "../utils/material-utils";
import { showHoverEffect } from "../utils/permissions-utils";

const interactorOneTransform = [];
const interactorTwoTransform = [];

export const validMaterials = ["MeshStandardMaterial", "MeshBasicMaterial", "MobileStandardMaterial"];
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
    this.boundingSphere = new THREE.Sphere();

    this.sweepParams = [0, 0];
  },
  remove() {
    this.uniforms = null;
    this.boundingBox = null;

    // Used when the object is batched
    const batchManagerSystem = AFRAME.scenes[0].systems["hubs-systems"].batchManagerSystem;
    this.el.object3D.traverse(object => {
      if (!object.material) return;
      forEachMaterial(object, material => {
        if (
          !validMaterials.includes(material.type) ||
          object.el.classList.contains("ui") ||
          object.el.classList.contains("hud") ||
          object.el.getAttribute("text-button")
        )
          return;

        batchManagerSystem.meshToEl.delete(object);
      });
    });
  },
  tick(time) {
    if (!this.uniforms || !this.uniforms.length) return;

    const isFrozen = this.el.sceneEl.is("frozen");
    const showEffect = showHoverEffect(this.el);

    let interactorOne, interactorTwo;
    const interaction = AFRAME.scenes[0].systems.interaction;
    if (interaction.state.leftHand.hovered === this.el && !interaction.state.leftHand.held) {
      interactorOne = interaction.options.leftHand.entity.object3D;
    }
    if (interaction.state.rightRemote.hovered === this.el && !interaction.state.rightRemote.held) {
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
      const scaledRadius = this.el.object3D.scale.y * this.boundingSphere.radius;
      this.sweepParams[0] = worldY - scaledRadius;
      this.sweepParams[1] = worldY + scaledRadius;
    }

    for (let i = 0, l = this.uniforms.length; i < l; i++) {
      const uniform = this.uniforms[i];
      uniform.hubs_EnableSweepingEffect.value = this.data.enableSweepingEffect && showEffect;
      uniform.hubs_IsFrozen.value = isFrozen;
      uniform.hubs_SweepParams.value = this.sweepParams;

      uniform.hubs_HighlightInteractorOne.value = !!interactorOne && showEffect;
      uniform.hubs_InteractorOnePos.value[0] = interactorOneTransform[12];
      uniform.hubs_InteractorOnePos.value[1] = interactorOneTransform[13];
      uniform.hubs_InteractorOnePos.value[2] = interactorOneTransform[14];

      uniform.hubs_HighlightInteractorTwo.value = !!interactorTwo && showEffect;
      uniform.hubs_InteractorTwoPos.value[0] = interactorTwoTransform[12];
      uniform.hubs_InteractorTwoPos.value[1] = interactorTwoTransform[13];
      uniform.hubs_InteractorTwoPos.value[2] = interactorTwoTransform[14];

      if (interactorOne || interactorTwo || isFrozen) {
        uniform.hubs_Time.value = time;
      }
    }
  }
});
