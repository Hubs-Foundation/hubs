/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadAudioTexture } from "../utils/load-audio-texture";
import { HubsWorld } from "../app";
import { HubsVideoTexture } from "../textures/HubsVideoTexture";
import { EntityID } from "./networking-types";
import { MediaVideo } from "../bit-components";
import { VIDEO_FLAGS } from "../inflators/video";

export function* loadAudio(world: HubsWorld, eid: EntityID, url: string) {
  let loop = true;
  let autoPlay = true;
  let controls = true;
  let projection = ProjectionMode.FLAT;
  if (MediaVideo.flags[eid]) {
    autoPlay = (MediaVideo.flags[eid] & VIDEO_FLAGS.AUTOPLAY) !== 0;
    loop = (MediaVideo.flags[eid] & VIDEO_FLAGS.LOOP) !== 0;
    controls = (MediaVideo.flags[eid] & VIDEO_FLAGS.CONTROLS) !== 0;
    projection =
      (MediaVideo.flags[eid] & VIDEO_FLAGS.PROJECTION_EQUIRECT) !== 0
        ? ProjectionMode.SPHERE_EQUIRECTANGULAR
        : ProjectionMode.FLAT;
  }

  const { texture, ratio, video }: { texture: HubsVideoTexture; ratio: number; video: HTMLVideoElement } =
    yield loadAudioTexture(url, loop, autoPlay);

  return renderAsEntity(
    world,
    <entity
      name="Audio"
      networked
      networkedVideo
      grabbable={{ cursor: true, hand: false }}
      // Audio and Video are handled very similarly in 3D scene
      // so create as video
      video={{
        texture,
        ratio,
        autoPlay,
        projection,
        video,
        loop,
        controls
      }}
    ></entity>
  );
}
