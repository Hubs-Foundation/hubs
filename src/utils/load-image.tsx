/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { PROJECTION_MODE, ProjectionMode } from "./projection-mode";
import { loadTextureCancellable } from "../utils/load-texture";
import { renderAsEntity } from "../utils/jsx-entity";
import { HubsWorld } from "../app";
import { Texture } from "three";
import { ALPHA_MODE, AlphaMode } from "./create-image-mesh";
import { EntityID } from "./networking-types";
import { MediaImageLoaderData } from "../bit-components";
import { ImageParams } from "../inflators/image";

export function* createImageDef(world: HubsWorld, url: string, contentType: string): Generator<any, ImageParams, any> {
  const { texture, ratio, cacheKey }: { texture: Texture; ratio: number; cacheKey: string } =
    yield loadTextureCancellable(url, 1, contentType);

  // TODO it would be nice if we could be less aggressive with transparency here.
  // Doing so requires inspecting the raw file data upstream of here and passing
  // that info through somehow which feels tricky.
  let alphaMode: AlphaMode = AlphaMode.Blend;
  if (contentType === "image/gif") {
    alphaMode = AlphaMode.Mask;
  } else if (contentType === "image/jpeg") {
    alphaMode = AlphaMode.Opaque;
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
    if (params.projection === PROJECTION_MODE.FLAT) {
      imageDef.projection = ProjectionMode.FLAT;
    } else if (params.projection === PROJECTION_MODE.SPHERE_EQUIRECTANGULAR) {
      imageDef.projection = ProjectionMode.SPHERE_EQUIRECTANGULAR;
    }
    if (params.alphaMode === ALPHA_MODE.OPAQUE) {
      imageDef.alphaMode = AlphaMode.Opaque;
    } else if (params.alphaMode === ALPHA_MODE.BLEND) {
      imageDef.alphaMode = AlphaMode.Blend;
    } else if ((params.alphaMode = ALPHA_MODE.MASK)) {
    }
    imageDef.alphaMode === AlphaMode.Mask;
    imageDef.alphaCutoff = params.alphaCutoff;
    MediaImageLoaderData.delete(eid);
  }

  return renderAsEntity(world, <entity name="Image" image={imageDef} />);
}
