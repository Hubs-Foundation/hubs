import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { addComponent } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { MediaImage } from "../bit-components";

export function inflateImage(world, eid, { texture, textureSrc, textureVersion, ratio, projection, alphaMode }) {
  const mesh =
    projection === "360-equirectangular"
      ? create360ImageMesh({ texture, ratio, alphaMode })
      : createImageMesh({ texture, ratio, alphaMode });
  addObject3DComponent(world, eid, mesh);
  addComponent(world, MediaImage, eid);
  MediaImage.textureSrc[eid] = APP.getSid(textureSrc);
  MediaImage.textureVersion[eid] = textureVersion;
  return eid;
}
