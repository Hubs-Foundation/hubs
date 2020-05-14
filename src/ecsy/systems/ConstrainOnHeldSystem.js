import { System, Not } from "ecsy";
import { ConstrainOnHeld } from "../components/ConstrainOnHeld";
import { Held } from "../components/Held";
import { PhysicsConstraint } from "../components/PhysicsConstraint";
import { InteractionState } from "../components/InteractionState";
import { Interactor } from "../components/Interactor";

function getInteractorHoldingEntity(interactionState, interactorEntities, entity) {
  for (let i = 0; i < interactorEntities.length; i++) {
    const interactorEntity = interactorEntities[i];
    const interactorId = interactorEntity.getComponent(Interactor).id;
    const interactorState = interactionState[interactorId];

    if (interactorState && interactorState.held === entity) {
      return interactorEntity;
    }
  }

  return null;
}

export class ConstrainOnHeldSystem extends System {
  static queries = {
    interactionState: {
      components: [InteractionState]
    },
    interactorEntities: {
      components: [Interactor]
    },
    heldEntities: {
      components: [ConstrainOnHeld, Held, Not(PhysicsConstraint)]
    },
    releasedEntities: {
      components: [ConstrainOnHeld, Not(Held), PhysicsConstraint]
    }
  };

  execute() {
    const interactionState = this.queries.interactionState.results[0].getComponent(InteractionState);

    const heldEntities = this.queries.heldEntities.results;
    const interactorEntities = this.queries.interactorEntities.results;

    for (let i = heldEntities.length - 1; i >= 0; i--) {
      const entity = heldEntities[i];
      const interactor = getInteractorHoldingEntity(interactionState, interactorEntities, entity);
      entity.addComponent(PhysicsConstraint, { target: interactor });
    }

    const releasedEntities = this.queries.releasedEntities.results;

    for (let i = releasedEntities.length - 1; i >= 0; i--) {
      const entity = releasedEntities[i];
      entity.removeComponent(PhysicsConstraint);
    }
  }
}
