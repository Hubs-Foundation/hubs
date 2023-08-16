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

  if (projection !== undefined) {
    MediaImage.projection[eid] = APP.getSid(projection);
  } else {
    MediaImage.projection[eid] = APP.getSid(ProjectionMode.FLAT);
  }
  if (alphaMode !== undefined) {
    MediaImage.alphaMode[eid] = APP.getSid(alphaMode);
  } else {
    MediaImage.alphaMode[eid] = APP.getSid(AlphaMode.Opaque);
  }
  if (alphaCutoff !== undefined) {
    MediaImage.alphaCutoff[eid] = alphaCutoff;
  } else {
    MediaImage.alphaCutoff[eid] = 0;
  }

  MediaImage.cacheKey[eid] = APP.getSid(cacheKey);
  return eid;
}
