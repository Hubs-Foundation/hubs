/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { loadTextureCancellable } from "../utils/load-texture";
import { renderAsEntity } from "../utils/jsx-entity";
import { HubsWorld } from "../app";
import { Texture } from "three";
import { AlphaMode } from "./create-image-mesh";

export function* loadImage({
  world,
  accessibleUrl,
  contentType
}: {
  world: HubsWorld;
  accessibleUrl: string;
  contentType: string;
}) {
  const { texture, ratio }: { texture: Texture; ratio: number } = yield loadTextureCancellable({
    src: accessibleUrl,
    version: 1,
    contentType
  });
  return renderAsEntity(
    world,
    <entity
      name="Image"
      image={{
        texture,
        textureSrc: accessibleUrl,
        textureVersion: 1,
        ratio,
        projection: "flat",
        alphaMode: AlphaMode.Opaque
      }}
    />
  );
}
