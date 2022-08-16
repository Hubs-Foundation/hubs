/** @jsx createElementEntity */
import { createElementEntity, createRef } from "../utils/jsx-entity";
import { IWorld } from "bitecs";
import { VideoTexture } from "three";
/* import { Button } from "../prefabs/camera-tool"; */
import { renderAsEntity } from "../utils/jsx-entity";
import { loadVideoTexture } from "../utils/load-video-texture";
import { Button } from "../prefabs/camera-tool";

export function* loadVideo({
  world,
  accessibleUrl
}: {
  world: IWorld;
  accessibleUrl: string;
  canonicalAudioUrl: string;
  contentType: string;
}) {
  console.log(`Url is ${accessibleUrl}`);
  const { texture, ratio }: { texture: VideoTexture; ratio: number } = yield loadVideoTexture({ src: accessibleUrl });

  const playButtonRef = createRef();
  const uiZ = 0.1;
  return renderAsEntity(
    world,
    <entity
      networked
      networked-video={{ time: 0.0 }}
      video={{
        texture,
        textureSrc: accessibleUrl,
        textureVersion: 1,
        ratio,
        autoPlay: true,
        projection: "flat",
        playButtonRef
      }}
    >
      <Button ref={playButtonRef} position={[0, 0, uiZ]} width={0.4} height={0.4} text={"Play"} />
    </entity>
  );
}
