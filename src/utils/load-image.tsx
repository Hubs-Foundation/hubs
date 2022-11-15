/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { loadTextureCancellable } from "../utils/load-texture";
import { renderAsEntity } from "../utils/jsx-entity";
import { HubsWorld } from "../app";
import { Texture } from "three";
import { AlphaMode } from "./create-image-mesh";

export function* loadImage(world: HubsWorld, url: string, contentType: string) {
  const { texture, ratio, cacheKey }: { texture: Texture; ratio: number; cacheKey: string } =
    yield loadTextureCancellable(url, 1, contentType);
  return renderAsEntity(
    world,
    <entity
      name="Image"
      image={{
        texture,
        ratio,
        projection: ProjectionMode.FLAT,
        alphaMode: AlphaMode.Opaque,
        cacheKey
      }}
    />
  );
}
