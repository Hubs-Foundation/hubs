import { System } from "ecsy";
import { Object3D } from "ecsy-three";
import { Interactable } from "../components/Interactable";
import { RaycastInteractor } from "../components/RaycastInteractor";
import { PhysicsInteractor } from "../components/PhysicsInteractor";
import { PhysicsBody } from "../components/PhysicsBody";
import { Interactor } from "../components/Interactor";
import { Raycaster } from "../components/Raycaster";
import { ActionFrame } from "../components/ActionFrame";

export class InteractionSystem extends System {
  static queries = {
    actionFrames: {
      components: [ActionFrame]
    },
    raycastInteractors: {
      components: [Interactor, RaycastInteractor, Raycaster]
    },
    physicsInteractors: {
      components: [Interactor, PhysicsInteractor, PhysicsBody]
    },
    interactors: {
      components: [Interactor, Object3D]
    },
    interactables: {
      components: [Interactable, Object3D]
    }
  };

  execute() {
    const actionFrame = this.queries.actionFrames.results[0].getComponent(ActionFrame).value;

    const interactors = this.queries.interactors.results;

    for (let i = 0; i < interactors.length; i++) {
      const entity = interactors[i];
      const interactor = entity.getComponent(Interactor);

      // Reset the interactor state
      interactor.hoverStarted = false;
      interactor.hoverEnded = false;
      interactor.grabStarted = false;
      interactor.grabEnded = false;
      interactor.attachedEntitiesAdded = false;
      interactor.attachedEntitiesRemoved = false;

      // Process the grab actions
      if (actionFrame.get(interactor.grabStartActionPath)) {
        interactor.grabbing = true;
        interactor.grabStarted = true;
      }

      if (actionFrame.get(interactor.grabEndActionPath)) {
        interactor.grabbing = false;
        interactor.grabEnded = true;
      }
    }

    const raycastInteractors = this.queries.raycastInteractors.results;
    const interactables = this.queries.interactables.results;

    for (let i = 0; i < raycastInteractors.length; i++) {
      const entity = raycastInteractors[i];

      const interactor = entity.getComponent(Interactor);

      if (!interactor.grabbing) {
        const raycastInteractor = entity.getMutableComponent(RaycastInteractor);

        // Reconstruct the raycaster targets array
        raycastInteractor.targets.length = 0;

        for (let j = 0; j < interactables.length; j++) {
          const interactableEntity = interactables[j];
          const interactableObject = interactableEntity.getComponent(Object3D).value;
          raycastInteractor.targets.push(interactableObject);
        }

        // Do the hover raycast
        const raycaster = entity.getComponent(Raycaster).value;

        raycastInteractor.intersections.length = 0;

        const intersections = raycaster.intersectObjects(
          raycastInteractor.targets,
          true,
          raycastInteractor.intersections
        );

        if (intersections.length > 0) {
          const intersection = intersections[0];
          interactor.hoverTarget = intersection;

          if (!interactor.hovering) {
            interactor.hoverStarted = true;
          }

          interactor.hovering = true;
        } else {
          if (interactor.hovering) {
            interactor.hoverEnded = true;
          }

          interactor.hovering = false;
        }
      } else {
        interactor.hovering = false;
      }
    }
  }
}
