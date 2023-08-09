/** @jsx createElementEntity */
import { createElementEntity, renderAsEntity } from "../utils/jsx-entity";
import { HubsWorld } from "../app";
import { guessContentType } from "./media-url-utils";
import { createImageDef } from "./load-image";

export function* loadHtml(world: HubsWorld, url: string, thumbnailUrl: string) {
  console.log("*** loadHTML", url, thumbnailUrl);
  const imageDef = yield* createImageDef(world, thumbnailUrl || url, guessContentType(thumbnailUrl) || "image/png");
  return renderAsEntity(
    world,
    <entity name="HTML" image={imageDef} grabbable={{ cursor: true, hand: false }} link={{ href: url }} />
  );
}
