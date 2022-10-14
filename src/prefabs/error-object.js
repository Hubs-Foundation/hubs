/** @jsx createElementEntity */
import { createElementEntity, ProjectionMode } from "../utils/jsx-entity";
import { errorTexture } from "../utils/error-texture";
import { AlphaMode } from "../utils/create-image-mesh";

export function ErrorObject() {
  return (
    <entity
      image={{
        texture: errorTexture,
        ratio: 1400 / 1200,
        projection: ProjectionMode.FLAT,
        alphaMode: AlphaMode.Blend
      }}
      textureCacheKey={{
        src: "error",
        version: 1
      }}
    />
  );
}
