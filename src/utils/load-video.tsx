/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadVideoTexture } from "../utils/load-video-texture";
import { HubsWorld } from "../app";
import { HubsVideoTexture } from "../textures/HubsVideoTexture";
import { EntityID } from "./networking-types";
import { MediaVideo } from "../bit-components";
import { VIDEO_FLAGS } from "../inflators/video";

export function* loadVideo(world: HubsWorld, eid: EntityID, url: string, contentType: string) {
  let loop = true;
  let autoPlay = true;
  let controls = true;
  if (MediaVideo.flags[eid]) {
    loop = (MediaVideo.flags[eid] & VIDEO_FLAGS.LOOP) !== 0;
    autoPlay = (MediaVideo.flags[eid] & VIDEO_FLAGS.AUTOPLAY) !== 0;
    controls = (MediaVideo.flags[eid] & VIDEO_FLAGS.CONTROLS) !== 0;
  } else {
    MediaVideo.flags[eid] |= VIDEO_FLAGS.AUTOPLAY;
    MediaVideo.flags[eid] |= VIDEO_FLAGS.LOOP;
    MediaVideo.flags[eid] |= VIDEO_FLAGS.CONTROLS;
  }
  let projection = ProjectionMode.FLAT;
  if (MediaVideo.projection[eid]) {
    projection = APP.getString(MediaVideo.projection[eid]) as ProjectionMode;
  } else {
    MediaVideo.projection[eid] = APP.getSid(ProjectionMode.FLAT);
  }

  const { texture, ratio, video }: { texture: HubsVideoTexture; ratio: number; video: HTMLVideoElement } =
    yield loadVideoTexture(url, contentType, loop, autoPlay);

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
        autoPlay,
        projection,
        video,
        loop,
        controls
      }}
    ></entity>
  );
}
