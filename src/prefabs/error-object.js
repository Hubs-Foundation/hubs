/** @jsx createElementEntity */
import { createElementEntity, ProjectionMode } from "../utils/jsx-entity";
import { AlphaMode } from "../utils/create-image-mesh";
import { TextureCache } from "../utils/texture-cache";
import { loadTextureFromCache } from "../utils/load-texture";

export function ErrorObject() {
  return (
    <entity
      image={{
        texture: loadTextureFromCache("error", 1).texture,
        ratio: 1400 / 1200,
        projection: ProjectionMode.FLAT,
        alphaMode: AlphaMode.Blend,
        cacheKey: TextureCache.key("error", 1)
      }}
    />
  );
}
