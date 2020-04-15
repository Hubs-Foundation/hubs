import { System } from "../System";
import { InteractableComponent } from "../components";

export class InteractableSystem extends System {
  constructor(world) {
    super(world);
  }

  update() {
    const state = AFRAME.scenes[0].systems.interaction.state;
    const interactables = this.world.entitiesByComponent.get(InteractableComponent);

    interactables.forEach(entity => {
      const interactable = entity.getComponent(InteractableComponent);

      interactable.hovered = false;
      interactable.held = false;

      if (state.leftRemote.hovered === entity) {
        interactable.hovered = true;
      }

      if (state.leftRemote.held === entity) {
        interactable.held = true;
      }

      if (state.rightRemote.hovered === entity) {
        interactable.hovered = true;
      }

      if (state.rightRemote.held === entity) {
        interactable.held = true;
      }

      if (state.leftHand.hovered === entity) {
        interactable.hovered = true;
      }

      if (state.leftHand.held === entity) {
        interactable.held = true;
      }

      if (state.rightHand.hovered === entity) {
        interactable.hovered = true;
      }

      if (state.rightHand.held === entity) {
        interactable.held = true;
      }
    });
  }
}
