import { System } from "ecsy";
import { Object3DComponent } from "ecsy-three";
import { Rotating } from "../components/Rotating";

export class RotationSystem extends System {
  static queries = {
    entities: {
      components: [Rotating, Object3DComponent]
    }
  };

  execute(delta) {
    this.queries.entities.results.forEach(entity => {
      const obj = entity.getObject3d();
      obj.rotation.x += 0.5 * delta;
      obj.rotation.y += 0.1 * delta;
      obj.matrixNeedsUpdate = true;
    });
  }
}
