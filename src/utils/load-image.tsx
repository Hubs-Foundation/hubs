/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode, getProjectionFromProjectionName } from "./projection-mode";
import { loadTextureCancellable } from "../utils/load-texture";
import { renderAsEntity } from "../utils/jsx-entity";
import { HubsWorld } from "../app";
import { Texture } from "three";
import { AlphaMode, getAlphaModeFromAlphaModeName } from "./create-image-mesh";
import { EntityID } from "./networking-types";
import { MediaImageLoaderData } from "../bit-components";
import { ImageParams } from "../inflators/image";

export function* createImageDef(world: HubsWorld, url: string, contentType: string): Generator<any, ImageParams, any> {
  const { texture, ratio, cacheKey }: { texture: Texture; ratio: number; cacheKey: string } =
    yield loadTextureCancellable(url, 1, contentType);

  // TODO it would be nice if we could be less aggressive with transparency here.
  // Doing so requires inspecting the raw file data upstream of here and passing
  // that info through somehow which feels tricky.
  let alphaMode: AlphaMode = AlphaMode.BLEND;
  if (contentType === "image/gif") {
    alphaMode = AlphaMode.MASK;
  } else if (contentType === "image/jpeg") {
    alphaMode = AlphaMode.OPAQUE;
  }

  return {
    texture,
    ratio,
    projection: ProjectionMode.FLAT,
    alphaMode,
    alphaCutoff: 0.5,
    cacheKey
  };
}

export function* loadImage(world: HubsWorld, eid: EntityID, url: string, contentType: string) {
  const imageDef = yield* createImageDef(world, url, contentType);

  if (MediaImageLoaderData.has(eid)) {
    const params = MediaImageLoaderData.get(eid)!;
    imageDef.projection = getProjectionFromProjectionName(params.projection);
    imageDef.alphaMode = getAlphaModeFromAlphaModeName(params.alphaMode);
    imageDef.alphaCutoff = params.alphaCutoff;
    MediaImageLoaderData.delete(eid);
  }

  return renderAsEntity(world, <entity name="Image" image={imageDef} />);
}
