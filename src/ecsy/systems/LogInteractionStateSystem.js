import { System } from "ecsy";
import { Held } from "../components/Held";

export class LogInteractionStateSystem extends System {
  static queries = {
    heldEntities: {
      components: [Held],
      listen: {
        added: true,
        removed: true
      }
    }
  };

  execute() {
    const holdStartedEntities = this.queries.heldEntities.added;

    for (let i = 0; i < holdStartedEntities.length; i++) {
      const entity = holdStartedEntities[i];
      console.log("holdStart", entity);
    }

    const heldEntities = this.queries.heldEntities.results;

    for (let i = 0; i < heldEntities.length; i++) {
      const entity = heldEntities[i];
      console.log("held", entity);
    }

    const holdEndedEntities = this.queries.heldEntities.removed;

    for (let i = 0; i < holdEndedEntities.length; i++) {
      const entity = holdEndedEntities[i];
      console.log("holdEnded", entity);
    }
  }
}
