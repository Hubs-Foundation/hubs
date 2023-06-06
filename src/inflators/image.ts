import { addComponent } from "bitecs";
import { MediaImage } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";
import { AlphaMode, create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { ProjectionMode } from "../utils/projection-mode";
import { Texture } from "three";
import { HubsWorld } from "../app";
import { EntityID } from "../utils/networking-types";

export const IMAGE_FLAGS = {
  ALPHA_MODE_OPAQUE: 1 << 0,
  ALPHA_MODE_BLEND: 1 << 1,
  ALPHA_MODE_MASK: 1 << 2,
  PROJECTION_FLAT: 1 << 3,
  PROJECTION_EQUIRECT: 1 << 4
};

export interface ImageParams {
  cacheKey: string;
  texture: Texture;
  ratio: number;
  projection: ProjectionMode;
  alphaMode: AlphaMode;
  alphaCutoff: number;
}

export function inflateImage(world: HubsWorld, eid: EntityID, params: ImageParams) {
  const { texture, ratio, projection, alphaMode, alphaCutoff, cacheKey } = params;
  const mesh =
    projection === ProjectionMode.SPHERE_EQUIRECTANGULAR
      ? create360ImageMesh(texture, alphaMode, alphaCutoff)
      : createImageMesh(texture, ratio, alphaMode, alphaCutoff);
  addObject3DComponent(world, eid, mesh);
  addComponent(world, MediaImage, eid);
  MediaImage.cacheKey[eid] = APP.getSid(cacheKey);
  return eid;
}
