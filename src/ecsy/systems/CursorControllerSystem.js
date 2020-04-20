import { System } from "ecsy";
import { CursorController } from "../components/CursorController";
import { AFrameEntity } from "../components/AFrameEntity";
import { RaycastInteractor } from "../components/RaycastInteractor";
import { Interactor } from "../components/Interactor";

export class CursorControllerSystem extends System {
  static queries = {
    cursorControllers: {
      components: [CursorController, RaycastInteractor, Interactor]
    }
  };

  execute() {
    const cursorControllers = this.queries.cursorControllers.results;

    for (let i = 0; i < cursorControllers.length; i++) {
      const entity = cursorControllers[i];
      const interactor = entity.getComponent(Interactor);
      const raycastInteractor = entity.getComponent(RaycastInteractor);

      // TODO: Move cursor-controller AFrame component to this system
      const aframeEntity = entity.getComponent(AFrameEntity);

      if (aframeEntity) {
        const cursorController = aframeEntity.value.components["cursor-controller"];

        if (interactor.hovering) {
          cursorController.forceCursorType = "highlight";
          cursorController.forceDistance = raycastInteractor.intersections[0].distance;
        } else {
          cursorController.forceCursorType = null;
          cursorController.forceDistance = null;
        }
      }
    }
  }
}
