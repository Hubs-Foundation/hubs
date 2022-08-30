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
  const { texture, ratio }: { texture: VideoTexture; ratio: number } = yield loadVideoTexture({ src: accessibleUrl });

  return renderAsEntity(
    world,
    <entity
      name="Video"
      networked
      networkedVideo
      grabbable={{ cursor: true, hand: false }}
      video={{
        texture,
        ratio,
        autoPlay: true,
        projection: "flat"
      }}
    ></entity>
  );
}
