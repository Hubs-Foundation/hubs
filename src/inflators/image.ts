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
  alphaCutoff?: number;
  renderOrder?: number;
}

const DEFAULTS: Partial<ImageParams> = {
  projection: ProjectionMode.FLAT,
  alphaMode: AlphaMode.OPAQUE,
  alphaCutoff: 0.5,
  ratio: 1,
  renderOrder: 0
};

export function inflateImage(world: HubsWorld, eid: EntityID, params: ImageParams) {
  const { texture, ratio, projection, alphaMode, alphaCutoff, cacheKey } = params;
  const mesh =
    projection === ProjectionMode.SPHERE_EQUIRECTANGULAR
      ? create360ImageMesh(texture, alphaMode, alphaCutoff)
      : createImageMesh(texture, ratio, alphaMode, alphaCutoff);
  addObject3DComponent(world, eid, mesh);
  addComponent(world, MediaImage, eid);

  const requiredParams = Object.assign({}, DEFAULTS, params) as Required<ImageParams>;
  MediaImage.projection[eid] = requiredParams.projection;
  MediaImage.alphaMode[eid] = requiredParams.alphaMode;
  MediaImage.alphaCutoff[eid] = requiredParams.alphaCutoff;
  MediaImage.cacheKey[eid] = APP.getSid(cacheKey);

  mesh.renderOrder = requiredParams.renderOrder;

  return eid;
}
