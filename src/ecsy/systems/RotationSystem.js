import { System } from "ecsy";
import { Object3DTag } from "ecsy-three";
import { Rotating } from "../components/Rotating";

export class RotationSystem extends System {
  static queries = {
    entities: {
      components: [Rotating, Object3DTag]
    }
  };

  execute(delta) {
    this.queries.entities.results.forEach(entity => {
      entity.rotation.x += 0.5 * delta;
      entity.rotation.y += 0.1 * delta;
      entity.matrixNeedsUpdate = true;
    });
  }
}
