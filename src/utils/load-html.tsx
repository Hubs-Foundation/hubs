/** @jsx createElementEntity */
import { createElementEntity, renderAsEntity } from "../utils/jsx-entity";
import { HubsWorld } from "../app";
import { guessContentType } from "./media-url-utils";
import { createImageDef } from "./load-image";

export function* loadHtml(world: HubsWorld, url: string, thumbnailUrl: string) {
  const imageDef = yield* createImageDef(world, thumbnailUrl, guessContentType(thumbnailUrl) || "image/png");
  return renderAsEntity(
    world,
    <entity
      name="HTML"
      image={imageDef}
      // TODO: Comment out for hover link menu
      //       Currently if commenting out the object
      //       won't move. RemoteHoverTarget component
      //       seems to be the cause. Investigate and
      //       fix the root issue.
      //link={{ href:url }}
    />
  );
}
