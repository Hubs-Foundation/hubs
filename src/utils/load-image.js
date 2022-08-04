import { loadTextureCancellable } from "../utils/load-texture";
import { renderAsEntity } from "../utils/jsx-entity";
import { Image } from "../prefabs/image";

export function* loadImage({ world, accessibleUrl, contentType }) {
  const { texture, ratio } = yield loadTextureCancellable({ src: accessibleUrl, version: 1, contentType });
  return renderAsEntity(
    world,
    Image({
      world,
      texture,
      ratio,
      textureSrc: accessibleUrl,
      textureVersion: 1,
      projection: "flat" /*TODO*/
    })
  );
}
