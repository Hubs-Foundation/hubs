/** @jsx createElementEntity */
import { BoxBufferGeometry, Mesh, MeshBasicMaterial, PlaneBufferGeometry } from "three";
import { Label } from "../prefabs/camera-tool";
import { AlphaMode } from "../utils/create-image-mesh";
import { createElementEntity, createRef } from "../utils/jsx-entity";
import { ProjectionMode } from "../utils/projection-mode";

import { textureLoader } from "../utils/media-utils";
import playImageUrl from "../assets/images/sprites/notice/play.png";
import pauseImageUrl from "../assets/images/sprites/notice/pause.png";
import { TextureCache } from "../utils/texture-cache";

const playTexture = textureLoader.load(playImageUrl);
const pauseTexture = textureLoader.load(pauseImageUrl);

function Slider({ trackRef, headRef, ...props }: any) {
  return (
    <entity {...props} name="Slider">
      <entity
        name="Slider:Track"
        videoMenuItem
        object3D={
          new Mesh(
            new PlaneBufferGeometry(1.0, 0.05),
            new MeshBasicMaterial({ opacity: 0.5, color: 0x000000, transparent: true })
          )
        }
        cursorRaycastable
        remoteHoverTarget
        holdable
        holdableButton
        ref={trackRef}
      >
        <entity
          name="Slider:Head"
          object3D={new Mesh(new BoxBufferGeometry(0.05, 0.05, 0.05), new MeshBasicMaterial())}
          ref={headRef}
        />
      </entity>
    </entity>
  );
}

export function VideoMenuPrefab() {
  const uiZ = 0.001;
  const timeLabelRef = createRef();
  const sliderRef = createRef();
  const headRef = createRef();
  const trackRef = createRef();
  const playIndicatorRef = createRef();
  const pauseIndicatorRef = createRef();
  const halfHeight = 9 / 16 / 2;

  return (
    <entity
      name="Video Menu"
      videoMenu={{ sliderRef, timeLabelRef, headRef, trackRef, playIndicatorRef, pauseIndicatorRef }}
    >
      <Label
        name="Time Label"
        text={{ anchorY: "top", anchorX: "right" }}
        ref={timeLabelRef}
        scale={[0.5, 0.5, 0.5]}
        position={[0.5 - 0.02, halfHeight - 0.02, uiZ]}
      />
      <Slider ref={sliderRef} trackRef={trackRef} headRef={headRef} position={[0, -halfHeight + 0.025, uiZ]} />
      <entity
        ref={playIndicatorRef}
        position={[0, 0, uiZ]}
        scale={[0.25, 0.25, 0.25]}
        image={{
          texture: playTexture,
          ratio: 1,
          projection: ProjectionMode.FLAT,
          alphaMode: AlphaMode.Blend,
          cacheKey: TextureCache.key(playImageUrl, 1)
        }}
        visible={false}
      />
      <entity
        ref={pauseIndicatorRef}
        position={[0, 0, uiZ]}
        scale={[0.25, 0.25, 0.25]}
        image={{
          texture: pauseTexture,
          ratio: 1,
          projection: ProjectionMode.FLAT,
          alphaMode: AlphaMode.Blend,
          cacheKey: TextureCache.key(pauseImageUrl, 1)
        }}
        visible={false}
      />
    </entity>
  );
}
