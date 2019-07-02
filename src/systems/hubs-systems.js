import { CursorTargettingSystem } from "./cursor-targetting-system";
import { ConstraintsSystem } from "./constraints-system";
import { TwoPointStretchingSystem } from "./two-point-stretching-system";
import { SingleActionButtonSystem, HoldableButtonSystem, HoverButtonSystem } from "./button-systems";
import { HoverMenuSystem } from "./hover-menu-system";
import { SuperSpawnerSystem } from "./super-spawner-system";
import { HapticFeedbackSystem } from "./haptic-feedback-system";
import { SoundEffectsSystem } from "./sound-effects-system";
import { RenderManagerSystem } from "./render-manager-system";
// import HoverVisualsSystem from "./highlight/hover-visuas-system";

export default class HoverVisualsSystem {
  constructor() {
    this.prevHighlights = {
      rightRemote: {
        entity: null,
        meshes: []
      },
      rightHand: {
        entity: null,
        meshes: []
      },
      leftHand: {
        entity: null,
        meshes: []
      }
    };
  }

  updateMesh(hand) {
    const interactionSystem = AFRAME.scenes[0].systems.interaction;
    const interaction = interactionSystem.state[hand];

    const entity = interaction.hovered || interaction.held;
    if (entity != this.prevHighlights[hand].entity) {
      this.prevHighlights[hand].meshes.forEach(o => {
        o.layers.disable(0);
      });
      this.prevHighlights[hand].meshes.length = 0;
      this.prevHighlights[hand].entity = entity;

      if (entity && entity.object3D && entity.components["hoverable-visuals"]) {
        entity.object3D.traverseVisible(o => {
          if (!o.isMesh || !o.batched) return;
          o.layers.enable(0);
          o.material.polygonOffset = true;
          o.material.polygonOffsetFactor = -2;
          o.material.polygonOffsetUnits = -3;
          this.prevHighlights[hand].meshes.push(o);
        });
      }
    }
  }

  tick() {
    this.updateMesh("rightRemote");
    this.updateMesh("rightHand");
    this.updateMesh("leftHand");
  }
}

AFRAME.registerSystem("hubs-systems", {
  init() {
    this.cursorTargettingSystem = new CursorTargettingSystem();
    this.constraintsSystem = new ConstraintsSystem();
    this.twoPointStretchingSystem = new TwoPointStretchingSystem();
    this.singleActionButtonSystem = new SingleActionButtonSystem();
    this.holdableButtonSystem = new HoldableButtonSystem();
    this.hoverButtonSystem = new HoverButtonSystem();
    this.hoverMenuSystem = new HoverMenuSystem();
    this.superSpawnerSystem = new SuperSpawnerSystem();
    this.hapticFeedbackSystem = new HapticFeedbackSystem();
    this.soundEffectsSystem = new SoundEffectsSystem();
    this.renderManagerSystem = new RenderManagerSystem(this.el.sceneEl.object3D, this.el.sceneEl.renderer);
    this.hoverVisualsSystem = new HoverVisualsSystem(this.el.sceneEl.object3D);
  },

  tick(t) {
    const systems = AFRAME.scenes[0].systems;
    systems.userinput.tick2();
    systems.interaction.tick2(this.soundEffectsSystem);
    this.superSpawnerSystem.tick();
    this.cursorTargettingSystem.tick(t);
    this.constraintsSystem.tick();
    this.twoPointStretchingSystem.tick();
    this.singleActionButtonSystem.tick();
    this.holdableButtonSystem.tick();
    this.hoverButtonSystem.tick();
    this.hoverMenuSystem.tick();
    this.hapticFeedbackSystem.tick(this.twoPointStretchingSystem, this.singleActionButtonSystem.didInteractThisFrame);
    this.soundEffectsSystem.tick();
    this.renderManagerSystem.tick(t);
    this.hoverVisualsSystem.tick(t);
  },

  remove() {
    this.cursorTargettingSystem.remove();
  }
});
