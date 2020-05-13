import { System } from "ecsy";
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
      components: [Held]
    },
    hoveredEntities: {
      components: [Hovered]
    },
    hoverableEntities: {
      components: [Hoverable]
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

      if (interactor.hovered && interactor.hovered.isECSYThreeEntity) {
        interactor.hovered.addComponent(Hovered);
      }

      if (interactor.held && interactor.held.isECSYThreeEntity) {
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

    const hoverableEntities = this.queries.hoverableEntities.results;
    const cursorTargettingSystem = AFRAME.scenes[0].systems["hubs-systems"].cursorTargettingSystem;

    cursorTargettingSystem.hoverableEntities.length = 0;

    for (let i = 0; i < hoverableEntities.length; i++) {
      cursorTargettingSystem.hoverableEntities.push(hoverableEntities[i]);
    }
  }
}
