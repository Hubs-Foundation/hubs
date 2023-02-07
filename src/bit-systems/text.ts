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
    // sync() call can happen one frame after that text
    // properties are updated by some other systems unless
    // this system is guaranteed that it runs after all
    // other systems in the frame. But it may not be
    // a big deal because what sync() invokes is async
    // processing.
    //
    // Question: Is it safe even if text object is
    // disposed before the async processing is done?
    text.sync();
  });
}
