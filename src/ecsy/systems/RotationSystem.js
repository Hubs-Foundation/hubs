import { System } from "ecsy";
import { Transform } from "ecsy-three";
import { Rotating } from "../components/Rotating";

export class RotationSystem extends System {
  static queries = {
    entities: {
      components: [Rotating, Transform]
    }
  };

  execute(delta) {
    this.queries.entities.results.forEach(entity => {
      const rotation = entity.getMutableComponent(Transform).rotation;
      rotation.x += 0.5 * delta;
      rotation.y += 0.1 * delta;
    });
  }
}
