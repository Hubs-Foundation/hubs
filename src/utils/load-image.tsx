/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { loadTextureCancellable } from "../utils/load-texture";
import { renderAsEntity } from "../utils/jsx-entity";
import { HubsWorld } from "../app";

export function* loadImage({
  world,
  accessibleUrl,
  contentType
}: {
  world: HubsWorld;
  accessibleUrl: string;
  contentType: string;
}) {
  const { texture, ratio } = yield loadTextureCancellable({ src: accessibleUrl, version: 1, contentType });
  return renderAsEntity(world, <entity image={{ texture, textureSrc: accessibleUrl, textureVersion: 1, ratio, projection: "flat" }} />);
}
