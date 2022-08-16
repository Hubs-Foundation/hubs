/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { errorTexture } from "../utils/error-texture";

export function ErrorObject() {
  return (
    <entity
      image={{
        texture: errorTexture,
        textureSrc: "error",
        textureVersion: 1,
        ratio: 1400 / 1200,
        projection: "flat" /* TODO */
      }}
    />
  );
}
