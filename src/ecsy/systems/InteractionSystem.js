import { System } from "ecsy";
import { Object3DComponent } from "ecsy-three";
import { InteractionState } from "../components/InteractionState";
import { Held } from "../components/Held";
import { Hovered } from "../components/Hovered";
import { Hoverable } from "../components/Hoverable";

const interactorNames = ["leftHand", "rightHand", "leftRemote", "rightRemote"];

export class InteractionSystem extends System {
  static queries = {
    interactionStateEntities: {
      components: [InteractionState]
    },
    heldEntities: {
      components: [Object3DComponent, Held]
    },
    hoveredEntities: {
      components: [Object3DComponent, Hovered]
    },
    hoverableEntities: {
      components: [Object3DComponent, Hoverable],
      listen: {
        added: true,
        removed: true,
        changed: true
      }
    }
  };

  execute() {
    const interactionState = this.queries.interactionStateEntities.results[0].getComponent(InteractionState);

    for (let i = 0; i < interactorNames.length; i++) {
      const interactorName = interactorNames[i];
      const interactor = interactionState[interactorName];

      if (!interactor) {
        continue;
      }

      const { hovered, held } = interactor;

      if (hovered && hovered.isECSYEntity && !hovered.hasComponent(Hovered)) {
        interactor.hovered.addComponent(Hovered);
      }

      if (held && held.isECSYEntity && !hovered.hasComponent(Held)) {
        interactor.held.addComponent(Held);
      }
    }

    const hoveredEntities = this.queries.hoveredEntities.results;

    for (let i = hoveredEntities.length - 1; i >= 0; i--) {
      const entity = hoveredEntities[i];
      let released = true;

      for (let i = 0; i < interactorNames.length; i++) {
        const interactorName = interactorNames[i];
        const interactor = interactionState[interactorName];

        if (interactor.hovered === entity) {
          released = false;
          break;
        }
      }

      if (released) {
        entity.removeComponent(Hovered);
      }
    }

    const heldEntities = this.queries.heldEntities.results;

    for (let i = heldEntities.length - 1; i >= 0; i--) {
      const entity = heldEntities[i];
      let released = true;

      for (let i = 0; i < interactorNames.length; i++) {
        const interactorName = interactorNames[i];
        const interactor = interactionState[interactorName];

        if (interactor.held === entity) {
          released = false;
          break;
        }
      }

      if (released) {
        entity.removeComponent(Held);
      }
    }

    if (this.queries.hoverableEntities.added.length > 0 || this.queries.hoverableEntities.removed.length > 0) {
      const cursorTargettingSystem = AFRAME.scenes[0].systems["hubs-systems"].cursorTargettingSystem;

      const hoverableEntities = this.queries.hoverableEntities.results;

      cursorTargettingSystem.hoverableECSYEntities.length = 0;

      for (let i = 0; i < hoverableEntities.length; i++) {
        cursorTargettingSystem.hoverableECSYEntities.push(hoverableEntities[i]);
      }

      cursorTargettingSystem.setDirty();
    }
  }
}
