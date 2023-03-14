import { defineQuery } from "bitecs";
import { Text as TroikaText } from "troika-three-text";
import { HubsWorld } from "../app";
import { TextTag } from "../bit-components";

const textQuery = defineQuery([TextTag]);

export function textSystem(world: HubsWorld) {
  textQuery(world).forEach(eid => {
    const text = world.eid2obj.get(eid)! as TroikaText;

    // sync() invokes async text processing in workers.
    // https://github.com/protectwise/troika/tree/main/packages/troika-three-text#handling-asynchronous-updates
    //
    // It is safe to call sync() every frame from the
    // performance and efficiency perspective because
    // sync() checks whether to invoke costly processing
    // inside.
    //
    // Ideally this system should run after any other systems
    // that can update text properties and we need to be careful
    // for the systems execution order. Otherwise sync() call
    // can happen one frame after. (But probably it may not be
    // a big deal even if it happens because what sync() invokes
    // is async processing, texture properties update will be
    // reflected some frames after in any case.)
    //
    // Assumes it is safe even if text object is
    // disposed before the async processing is done
    // because TroikaText properly handles
    text.sync();
  });
}
