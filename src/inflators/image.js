import { addComponent } from "bitecs";
import { MediaImage } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";
import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { ProjectionMode } from "../utils/projection-mode";

export function inflateImage(world, eid, { texture, ratio, projection, alphaMode, cacheKey }) {
  const mesh =
    projection === ProjectionMode.SPHERE_EQUIRECTANGULAR
      ? create360ImageMesh(texture, ratio, alphaMode)
      : createImageMesh(texture, ratio, alphaMode);
  addObject3DComponent(world, eid, mesh);
  addComponent(world, MediaImage, eid);
  MediaImage.cacheKey[eid] = APP.getSid(cacheKey);
  return eid;
}
