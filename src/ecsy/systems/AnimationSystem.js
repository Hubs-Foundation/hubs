import { System } from "ecsy";
import { Animation } from "../components/Animation";

export class AnimationSystem extends System {
  static queries = {
    entities: {
      components: [Animation]
    }
  };

  execute(dt) {
    const entities = this.queries.entities.results;

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const animation = entity.getComponent(Animation);
      animation.mixer.update(dt);
    }
  }
}
