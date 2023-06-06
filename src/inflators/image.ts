import { addComponent } from "bitecs";
import { MediaImage } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";
import { AlphaMode, create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { ProjectionMode } from "../utils/projection-mode";
import { Texture } from "three";
import { HubsWorld } from "../app";
import { EntityID } from "../utils/networking-types";

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

  if (projection) {
    MediaImage.projection[eid] = APP.getSid(projection);
  }
  if (alphaMode) {
    MediaImage.alphaMode[eid] = APP.getSid(alphaMode);
  }
  if (alphaCutoff) {
    MediaImage.alphaCutoff[eid] = alphaCutoff;
  }

  MediaImage.cacheKey[eid] = APP.getSid(cacheKey);
  return eid;
}
