/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { loadTextureCancellable } from "../utils/load-texture";
import { renderAsEntity } from "../utils/jsx-entity";

export function* loadImage({ world, accessibleUrl, contentType }) {
  const { texture, ratio } = yield loadTextureCancellable({ src: accessibleUrl, version: 1, contentType });
  return renderAsEntity(
    world,
    <entity image={{ texture, textureSrc: accessibleUrl, textureVersion: 1, ratio, projection: "flat" /* TODO */ }} />
  );
}
