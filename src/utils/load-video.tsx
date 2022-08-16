/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { VideoTexture } from "three";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadVideoTexture } from "../utils/load-video-texture";
import { HubsWorld } from "../app";

export function* loadVideo({
  world,
  accessibleUrl
}: {
  world: HubsWorld;
  accessibleUrl: string;
  canonicalAudioUrl: string;
  contentType: string;
}) {
  console.log(`Url is ${accessibleUrl}`);
  const { texture, ratio }: { texture: VideoTexture; ratio: number } = yield loadVideoTexture({ src: accessibleUrl });

  return renderAsEntity(
    world,
    <entity
      networked
      networked-video
      cursor-raycastable
      remote-hover-target
      video={{
        texture,
        textureSrc: accessibleUrl,
        textureVersion: 1,
        ratio,
        autoPlay: true,
        projection: "flat"
      }}
    ></entity>
  );
}
