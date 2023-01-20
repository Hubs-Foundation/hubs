/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { loadTextureCancellable } from "../utils/load-texture";
import { renderAsEntity } from "../utils/jsx-entity";
import { HubsWorld } from "../app";
import { Texture } from "three";
import { AlphaMode } from "./create-image-mesh";
import { MEDIA_LOADER_FLAGS } from "../bit-systems/media-loading";

// TODO AlphaMode is written in JS and should be a ts enum
type AlphaModeType = typeof AlphaMode.Opaque | typeof AlphaMode.Mask | typeof AlphaMode.Blend;
export function* loadImage(world: HubsWorld, flags: number, url: string, contentType: string) {
  const { texture, ratio, cacheKey }: { texture: Texture; ratio: number; cacheKey: string } =
    yield loadTextureCancellable(url, 1, contentType);

  // TODO it would be nice if we could be less agressive with transparency here.
  // Doing so requires inspecting the raw file data upstream of here and passing
  // that info through somehow which feels tricky.
  let alphaMode: AlphaModeType = AlphaMode.Blend;
  if (contentType === "image/gif") {
    alphaMode = AlphaMode.Mask;
  } else if (contentType === "image/jpeg") {
    alphaMode = AlphaMode.Opaque;
  }
  const projection =
    flags & MEDIA_LOADER_FLAGS.SPHERICAL_PROJECTION ? ProjectionMode.SPHERE_EQUIRECTANGULAR : ProjectionMode.FLAT;

  return renderAsEntity(
    world,
    <entity
      name="Image"
      image={{
        texture,
        ratio,
        projection,
        alphaMode,
        cacheKey
      }}
    />
  );
}
