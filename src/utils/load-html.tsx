/** @jsx createElementEntity */
import { createElementEntity, renderAsEntity } from "../utils/jsx-entity";
import { HubsWorld } from "../app";
import { guessContentType } from "./media-url-utils";
import { createImageDef } from "./load-image";
import { EntityID } from "./networking-types";
import { ObjectMenuTarget } from "../bit-components";
import { ObjectMenuTargetFlags } from "../inflators/object-menu-target";

export function* loadHtml(world: HubsWorld, eid: EntityID, url: string, thumbnailUrl: string) {
  const imageDef = yield* createImageDef(world, thumbnailUrl, guessContentType(thumbnailUrl) || "image/png");

  ObjectMenuTarget.flags[eid] |= ObjectMenuTargetFlags.Flat;

  return renderAsEntity(
    world,
    <entity
      name="HTML"
      image={imageDef}
      grabbable={{ cursor: true, hand: false }}
      link={{ href: url }}
      objectMenuTarget={{ isFlat: true }}
    />
  );
}
