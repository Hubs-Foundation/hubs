import { System } from "ecsy";
import { Object3D } from "ecsy-three";
import { Interactable } from "../components/Interactable";
import { RaycastInteractor } from "../components/RaycastInteractor";
import { PhysicsInteractor } from "../components/PhysicsInteractor";
import { PhysicsBody } from "../components/PhysicsBody";
import { Interactor } from "../components/Interactor";
import { Raycaster } from "../components/Raycaster";
import { ActionFrame } from "../components/ActionFrame";
import { Grabbable } from "../components/Grabbable";

function getHoverTarget(object, interactables) {
  let curObject = object;

  while (curObject) {
    for (let j = 0; j < interactables.length; j++) {
      const interactableEntity = interactables[j];
      const interactableObject = interactableEntity.getComponent(Object3D).value;

      if (interactableObject === curObject) {
        return interactableEntity;
      }
    }

    curObject = curObject.parent;
  }

  return null;
}

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
    },
    grabbables: {
      components: [Grabbable, PhysicsBody, Object3D]
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
    }

    const grabbables = this.queries.grabbables.results;

    for (let i = 0; i < grabbables.length; i++) {
      const entity = grabbables[i];
      const grabbable = entity.getComponent(Grabbable);
      grabbable.grabStarted = false;
      grabbable.grabEnded = false;
    }

    const raycastInteractors = this.queries.raycastInteractors.results;
    const interactables = this.queries.interactables.results;

    for (let i = 0; i < raycastInteractors.length; i++) {
      const entity = raycastInteractors[i];

      const interactor = entity.getMutableComponent(Interactor);

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
          const hoverObject = intersections[0].object;

          interactor.hoverTarget = getHoverTarget(hoverObject, interactables);

          if (!interactor.hovering) {
            interactor.hoverStarted = true;
          }

          interactor.hovering = true;
        } else {
          if (interactor.hovering) {
            interactor.hoverEnded = true;
            interactor.hoverTarget = null;
          }

          interactor.hovering = false;
        }
      } else {
        interactor.hovering = false;
      }
    }

    for (let i = 0; i < interactors.length; i++) {
      const entity = interactors[i];
      const interactor = entity.getComponent(Interactor);

      if (interactor.hovering && actionFrame.get(interactor.grabStartActionPath)) {
        const grabbable = interactor.hoverTarget.getComponent(Grabbable);
        grabbable.grabStarted = true;
        grabbable.grabbing = true;

        interactor.grabbing = true;
        interactor.grabStarted = true;
        interactor.grabTarget = interactor.hoverTarget;
        interactor.hoverTarget = null;
      }

      if (interactor.grabbing && actionFrame.get(interactor.grabEndActionPath)) {
        const grabbable = interactor.grabTarget.getComponent(Grabbable);
        grabbable.grabEnded = true;
        grabbable.grabbing = false;

        interactor.grabbing = false;
        interactor.grabEnded = true;
        interactor.grabTarget = null;
        interactor.hoverTarget = interactor.grabTarget;
      }
    }
  }
}
